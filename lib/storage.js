/**
 * Way data is stored for this database
 * For a Node.js/Node Webkit database it's the file system
 * For a browser-side database it's localforage which chooses the best option depending on user browser (IndexedDB then WebSQL then localStorage)
 *
 * This version is the Node.js/Node Webkit version
 * It's essentially fs, mkdirp and crash safe write and read functions
 */
const fs = require('fs')
const fsPromises = require('fs/promises')
const path = require('path')
const { callbackify, promisify } = require('util')
const storage = {}
const { Readable } = require('stream')

// eslint-disable-next-line node/no-callback-literal
storage.exists = (path, cb) => fs.access(path, fs.constants.F_OK, (err) => { cb(!err) })
storage.existsAsync = path => fsPromises.access(path, fs.constants.F_OK).then(() => true, () => false)
storage.rename = fs.rename
storage.renameAsync = fsPromises.rename
storage.writeFile = fs.writeFile
storage.writeFileAsync = fsPromises.writeFile
storage.unlink = fs.unlink
storage.unlinkAsync = fsPromises.unlink
storage.appendFile = fs.appendFile
storage.readFile = fs.readFile
storage.readFileStream = fs.createReadStream
storage.mkdir = fs.mkdir

/**
 * Explicit name ...
 */
storage.ensureFileDoesntExistAsync = async file => {
  if (await storage.existsAsync(file)) await storage.unlinkAsync(file)
}

storage.ensureFileDoesntExist = (file, callback) => callbackify(storage.ensureFileDoesntExistAsync)(file, err => callback(err))

/**
 * Flush data in OS buffer to storage if corresponding option is set
 * @param {String} options.filename
 * @param {Boolean} options.isDir Optional, defaults to false
 * If options is a string, it is assumed that the flush of the file (not dir) called options was requested
 */
storage.flushToStorage = (options, callback) => callbackify(storage.flushToStorageAsync)(options, callback)

storage.flushToStorageAsync = async (options) => {
  let filename
  let flags
  if (typeof options === 'string') {
    filename = options
    flags = 'r+'
  } else {
    filename = options.filename
    flags = options.isDir ? 'r' : 'r+'
  }

  // Windows can't fsync (FlushFileBuffers) directories. We can live with this as it cannot cause 100% dataloss
  // except in the very rare event of the first time database is loaded and a crash happens
  if (flags === 'r' && (process.platform === 'win32' || process.platform === 'win64')) return

  let fd, errorOnFsync, errorOnClose
  try {
    fd = await fsPromises.open(filename, flags)
    try {
      await fd.sync()
    } catch (errFS) {
      errorOnFsync = errFS
    }
  } finally {
    try {
      await fd.close()
    } catch (errC) {
      errorOnClose = errC
    }
  }
  if (errorOnFsync || errorOnClose) {
    const e = new Error('Failed to flush to storage')
    e.errorOnFsync = errorOnFsync
    e.errorOnClose = errorOnClose
    throw e
  }
}

/**
 * Fully write or rewrite the datafile
 * @param {String} filename
 * @param {String[]} lines
 * @param {Function} callback
 */
storage.writeFileLines = (filename, lines, callback = () => {}) => {
  try {
    const stream = fs.createWriteStream(filename)
    const readable = Readable.from(lines)
    readable.on('data', (line) => {
      try {
        stream.write(line)
        stream.write('\n')
      } catch (err) {
        callback(err)
      }
    })
    readable.on('end', () => {
      stream.close(callback)
    })
    readable.on('error', callback)
    stream.on('error', callback)
  } catch (err) {
    callback(err)
  }
}

storage.writeFileLinesAsync = (filename, lines) => promisify(storage.writeFileLines)(filename, lines)

/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)
 * @param {String} filename
 * @param {String[]} lines
 * @param {Function} callback Optional callback, signature: err
 */
storage.crashSafeWriteFileLines = (filename, lines, callback = () => {}) => {
  callbackify(storage.crashSafeWriteFileLinesAsync)(filename, lines, callback)
}

storage.crashSafeWriteFileLinesAsync = async (filename, lines) => {
  const tempFilename = filename + '~'

  await storage.flushToStorageAsync({ filename: path.dirname(filename), isDir: true })

  const exists = await storage.existsAsync(filename)
  if (exists) await storage.flushToStorageAsync({ filename })

  await storage.writeFileLinesAsync(tempFilename, lines)

  await storage.flushToStorageAsync(tempFilename)

  await storage.renameAsync(tempFilename, filename)

  await storage.flushToStorageAsync({ filename: path.dirname(filename), isDir: true })
}

/**
 * Ensure the datafile contains all the data, even if there was a crash during a full file write
 * @param {String} filename
 * @param {Function} callback signature: err
 */
storage.ensureDatafileIntegrity = (filename, callback) => callbackify(storage.ensureDatafileIntegrityAsync)(filename, callback)

storage.ensureDatafileIntegrityAsync = async filename => {
  const tempFilename = filename + '~'

  const filenameExists = await storage.existsAsync(filename)
  // Write was successful
  if (filenameExists) return

  const oldFilenameExists = await storage.existsAsync(tempFilename)
  // New database
  if (!oldFilenameExists) await storage.writeFileAsync(filename, '', 'utf8')
  // Write failed, use old version
  else await storage.renameAsync(tempFilename, filename)
}

// Interface
module.exports = storage
