/**
 * Way data is stored for this database
 * For a Node.js/Node Webkit database it's the file system
 * For a browser-side database it's localforage which chooses the best option depending on user browser (IndexedDB then WebSQL then localStorage)
 *
 * This version is the Node.js/Node Webkit version
 * It's essentially fs, mkdirp and crash safe write and read functions
 */
const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const { callbackify, promisify } = require('util')
const storage = {}
const { Readable } = require('stream')

/**
 * @callback Storage~existsCallback
 * @param {boolean} exists
 */

/**
 * @param {string} file
 * @param {Storage~existsCallback} cb
 */
// eslint-disable-next-line node/no-callback-literal
storage.exists = (file, cb) => fs.access(file, fs.constants.F_OK, (err) => { cb(!err) })
/**
 * @param {string} file
 * @return {Promise<boolean>}
 */
storage.existsAsync = file => fsPromises.access(file, fs.constants.F_OK).then(() => true, () => false)
storage.rename = fs.rename
storage.renameAsync = fsPromises.rename
storage.writeFile = fs.writeFile
storage.writeFileAsync = fsPromises.writeFile
storage.writeFileStream = fs.createWriteStream
storage.unlink = fs.unlink
storage.unlinkAsync = fsPromises.unlink
storage.appendFile = fs.appendFile
storage.appendFileAsync = fsPromises.appendFile
storage.readFile = fs.readFile
storage.readFileAsync = fsPromises.readFile
storage.readFileStream = fs.createReadStream
storage.mkdir = fs.mkdir
storage.mkdirAsync = fsPromises.mkdir

/**
 * @param {string} file
 * @return {Promise<void>}
 */
storage.ensureFileDoesntExistAsync = async file => {
  if (await storage.existsAsync(file)) await storage.unlinkAsync(file)
}

/**
 * @callback Storage~errorCallback
 * @param {?Error} err
 */

/**
 * @param {string} file
 * @param {Storage~errorCallback} callback
 */
storage.ensureFileDoesntExist = (file, callback) => callbackify(storage.ensureFileDoesntExistAsync)(file, err => callback(err))

/**
 * Flush data in OS buffer to storage if corresponding option is set
 * @param {object|string} options If options is a string, it is assumed that the flush of the file (not dir) called options was requested
 * @param {string} [options.filename]
 * @param {boolean} [options.isDir = false] Optional, defaults to false
 * @param {Storage~errorCallback} callback
 */
storage.flushToStorage = (options, callback) => callbackify(storage.flushToStorageAsync)(options, callback)

/**
 * Flush data in OS buffer to storage if corresponding option is set
 * @param {object|string} options If options is a string, it is assumed that the flush of the file (not dir) called options was requested
 * @param {string} [options.filename]
 * @param {boolean} [options.isDir = false] Optional, defaults to false
 * @return {Promise<void>}
 */
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

  /**
   * Some OSes and/or storage backends (augmented node fs) do not support fsync (FlushFileBuffers) directories,
   * or calling open() on directories at all. Flushing fails silently in this case, supported by following heuristics:
   *  + isDir === true
   *  |-- open(<dir>) -> (err.code === 'EISDIR'): can't call open() on directories (eg. BrowserFS)
   *  `-- fsync(<dir>) -> (errFS.code === 'EPERM' || errFS.code === 'EISDIR'): can't fsync directory: permissions are checked
   *        on open(); EPERM error should only occur on fsync incapability and not for general lack of permissions (e.g. Windows)
   *
   * We can live with this as it cannot cause 100% dataloss except in the very rare event of the first time
   * database is loaded and a crash happens.
   */

  let fd, errorOnFsync, errorOnClose // TODO: sometimes it leaves some file descriptors open
  try {
    fd = await fsPromises.open(filename, flags)
    try {
      await fd.sync()
    } catch (errFS) {
      errorOnFsync = errFS
    }
  } catch (error) {
    if (error.code !== 'EISDIR' || !options.isDir) throw error
  } finally {
    try {
      await fd.close()
    } catch (errC) {
      errorOnClose = errC
    }
  }
  if ((errorOnFsync || errorOnClose) && !((errorOnFsync.code === 'EPERM' || errorOnClose.code === 'EISDIR') && options.isDir)) {
    const e = new Error('Failed to flush to storage')
    e.errorOnFsync = errorOnFsync
    e.errorOnClose = errorOnClose
    throw e
  }
}

/**
 * Fully write or rewrite the datafile
 * @param {string} filename
 * @param {string[]} lines
 * @param {Storage~errorCallback} callback
 */
storage.writeFileLines = (filename, lines, callback = () => {}) => {
  try {
    const stream = storage.writeFileStream(filename)
    const readable = Readable.from(lines)
    readable.on('data', (line) => {
      try {
        stream.write(line + '\n')
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
/**
 * Fully write or rewrite the datafile
 * @param {string} filename
 * @param {string[]} lines
 * @return {Promise<void>}
 * @async
 */
storage.writeFileLinesAsync = (filename, lines) => promisify(storage.writeFileLines)(filename, lines)

/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)
 * @param {string} filename
 * @param {string[]} lines
 * @param {Storage~errorCallback} callback Optional callback, signature: err
 */
storage.crashSafeWriteFileLines = (filename, lines, callback = () => {}) => {
  callbackify(storage.crashSafeWriteFileLinesAsync)(filename, lines, callback)
}
/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)
 * @param {string} filename
 * @param {string[]} lines
 * @return {Promise<void>}
 */
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
 * @param {string} filename
 * @param {Storage~errorCallback} callback signature: err
 */
storage.ensureDatafileIntegrity = (filename, callback) => callbackify(storage.ensureDatafileIntegrityAsync)(filename, callback)

/**
 * Ensure the datafile contains all the data, even if there was a crash during a full file write
 * @param {string} filename
 * @return {Promise<void>}
 */
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
