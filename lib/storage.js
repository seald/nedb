/**
 * Way data is stored for this database.
 * This version is the Node.js/Node Webkit version.
 * It's essentially fs, mkdirp and crash safe write and read functions.
 *
 * @see module:storageBrowser
 * @see module:storageReactNative
 * @module storage
 */
const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const { callbackify, promisify } = require('util')
const { Readable } = require('stream')

/**
 * @callback module:storage~existsCallback
 * @param {boolean} exists
 */

/**
 * Callback returns true if file exists.
 * @param {string} file
 * @param {module:storage~existsCallback} cb
 * @alias module:storage.exists
 */
// eslint-disable-next-line node/no-callback-literal
const exists = (file, cb) => fs.access(file, fs.constants.F_OK, (err) => { cb(!err) })

/**
 * Async version of {@link module:storage.exists}.
 * @param {string} file
 * @return {Promise<boolean>}
 * @async
 * @alias module:storage.existsAsync
 * @see module:storage.exists
 */
const existsAsync = file => fsPromises.access(file, fs.constants.F_OK).then(() => true, () => false)

/**
 * Node.js' [fs.rename]{@link https://nodejs.org/api/fs.html#fsrenameoldpath-newpath-callback}.
 * @function
 * @param {string} oldPath
 * @param {string} newPath
 * @param {NoParamCallback} c
 * @return {void}
 * @alias module:storage.rename
 */
const rename = fs.rename

/**
 * Async version of {@link module:storage.rename}.
 * @function
 * @param {string} oldPath
 * @param {string} newPath
 * @return {Promise<void>}
 * @alias module:storage.renameAsync
 * @async
 * @see module:storage.rename
 */
const renameAsync = fsPromises.rename

/**
 * Node.js' [fs.writeFile]{@link https://nodejs.org/api/fs.html#fswritefilefile-data-options-callback}.
 * @function
 * @param {string} path
 * @param {string} data
 * @param {object} options
 * @param {function} callback
 * @alias module:storage.writeFile
 */
const writeFile = fs.writeFile

/**
 * Async version of {@link module:storage.writeFile}.
 * @function
 * @param {string} path
 * @param {string} data
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storage.writeFileAsync
 * @async
 * @see module:storage.writeFile
 */
const writeFileAsync = fsPromises.writeFile

/**
 * Node.js' [fs.createWriteStream]{@link https://nodejs.org/api/fs.html#fscreatewritestreampath-options}.
 * @function
 * @param {string} path
 * @param {Object} [options]
 * @return {fs.WriteStream}
 * @alias module:storage.writeFileStream
 */
const writeFileStream = fs.createWriteStream

/**
 * Node.js' [fs.unlink]{@link https://nodejs.org/api/fs.html#fsunlinkpath-callback}.
 * @function
 * @param {string} path
 * @param {function} callback
 * @alias module:storage.unlink
 */
const unlink = fs.unlink

/**
 * Async version of {@link module:storage.unlink}.
 * @function
 * @param {string} path
 * @return {Promise<void>}
 * @async
 * @alias module:storage.unlinkAsync
 * @see module:storage.unlink
 */
const unlinkAsync = fsPromises.unlink

/**
 * Node.js' [fs.appendFile]{@link https://nodejs.org/api/fs.html#fsappendfilepath-data-options-callback}.
 * @function
 * @param {string} path
 * @param {string} data
 * @param {object} options
 * @param {function} callback
 * @alias module:storage.appendFile
 */
const appendFile = fs.appendFile

/**
 * Async version of {@link module:storage.appendFile}.
 * @function
 * @param {string} path
 * @param {string} data
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storage.appendFileAsync
 * @async
 * @see module:storage.appendFile
 */
const appendFileAsync = fsPromises.appendFile

/**
 * Node.js' [fs.readFile]{@link https://nodejs.org/api/fs.html#fsreadfilepath-options-callback}
 * @function
 * @param {string} path
 * @param {object} options
 * @param {function} callback
 * @alias module:storage.readFile
 */
const readFile = fs.readFile

/**
 * Async version of {@link module:storage.readFile}.
 * @function
 * @param {string} path
 * @param {object} [options]
 * @return {Promise<Buffer>}
 * @alias module:storage.readFileAsync
 * @async
 * @see module:storage.readFile
 */
const readFileAsync = fsPromises.readFile

/**
 * Node.js' [fs.createReadStream]{@link https://nodejs.org/api/fs.html#fscreatereadstreampath-options}.
 * @function
 * @param {string} path
 * @param {Object} [options]
 * @return {fs.ReadStream}
 * @alias module:storage.readFileStream
 */
const readFileStream = fs.createReadStream

/**
 * Node.js' [fs.mkdir]{@link https://nodejs.org/api/fs.html#fsmkdirpath-options-callback}.
 * @function
 * @param {string} path
 * @param {object} options
 * @param {function} callback
 * @alias module:storage.mkdir
 */
const mkdir = fs.mkdir

/**
 * Async version of {@link module:storage.mkdir}.
 * @function
 * @param {string} path
 * @param {object} options
 * @return {Promise<void|string>}
 * @alias module:storage.mkdirAsync
 * @async
 * @see module:storage.mkdir
 */
const mkdirAsync = fsPromises.mkdir

/**
 * Async version of {@link module:storage.ensureFileDoesntExist}
 * @param {string} file
 * @return {Promise<void>}
 * @alias module:storage.ensureFileDoesntExistAsync
 * @async
 * @see module:storage.ensureFileDoesntExist
 */
const ensureFileDoesntExistAsync = async file => {
  if (await existsAsync(file)) await unlinkAsync(file)
}

/**
 * Removes file if it exists.
 * @param {string} file
 * @param {NoParamCallback} callback
 * @alias module:storage.ensureFileDoesntExist
 */
const ensureFileDoesntExist = (file, callback) => callbackify(ensureFileDoesntExistAsync)(file, err => callback(err))

/**
 * Flush data in OS buffer to storage if corresponding option is set.
 * @param {object|string} options If options is a string, it is assumed that the flush of the file (not dir) called options was requested
 * @param {string} [options.filename]
 * @param {boolean} [options.isDir = false] Optional, defaults to false
 * @param {NoParamCallback} callback
 * @alias module:storage.flushToStorage
 */
const flushToStorage = (options, callback) => callbackify(flushToStorageAsync)(options, callback)

/**
 * Async version of {@link module:storage.flushToStorage}.
 * @param {object|string} options
 * @param {string} [options.filename]
 * @param {boolean} [options.isDir = false]
 * @return {Promise<void>}
 * @alias module:storage.flushToStorageAsync
 * @async
 * @see module:storage.flushToStorage
 */
const flushToStorageAsync = async (options) => {
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
 * Fully write or rewrite the datafile.
 * @param {string} filename
 * @param {string[]} lines
 * @param {NoParamCallback} [callback = () => {}]
 * @alias module:storage.writeFileLines
 */
const writeFileLines = (filename, lines, callback = () => {}) => {
  try {
    const stream = writeFileStream(filename)
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
 * Async version of {@link module:storage.writeFileLines}.
 * @param {string} filename
 * @param {string[]} lines
 * @return {Promise<void>}
 * @alias module:storage.writeFileLinesAsync
 * @async
 * @see module:storage.writeFileLines
 */
const writeFileLinesAsync = (filename, lines) => promisify(writeFileLines)(filename, lines)

/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost).
 * @param {string} filename
 * @param {string[]} lines
 * @param {NoParamCallback} [callback] Optional callback, signature: err
 * @alias module:storage.crashSafeWriteFileLines
 */
const crashSafeWriteFileLines = (filename, lines, callback = () => {}) => {
  callbackify(crashSafeWriteFileLinesAsync)(filename, lines, callback)
}
/**
 * Async version of {@link module:storage.crashSafeWriteFileLines}.
 * @param {string} filename
 * @param {string[]} lines
 * @return {Promise<void>}
 * @alias module:storage.crashSafeWriteFileLinesAsync
 * @see module:storage.crashSafeWriteFileLines
 */
const crashSafeWriteFileLinesAsync = async (filename, lines) => {
  const tempFilename = filename + '~'

  await flushToStorageAsync({ filename: path.dirname(filename), isDir: true })

  const exists = await existsAsync(filename)
  if (exists) await flushToStorageAsync({ filename })

  await writeFileLinesAsync(tempFilename, lines)

  await flushToStorageAsync(tempFilename)

  await renameAsync(tempFilename, filename)

  await flushToStorageAsync({ filename: path.dirname(filename), isDir: true })
}

/**
 * Ensure the datafile contains all the data, even if there was a crash during a full file write.
 * @param {string} filename
 * @param {NoParamCallback} callback signature: err
 * @alias module:storage.ensureDatafileIntegrity
 */
const ensureDatafileIntegrity = (filename, callback) => callbackify(ensureDatafileIntegrityAsync)(filename, callback)

/**
 * Async version of {@link module:storage.ensureDatafileIntegrity}.
 * @param {string} filename
 * @return {Promise<void>}
 * @alias module:storage.ensureDatafileIntegrityAsync
 * @see module:storage.ensureDatafileIntegrity
 */
const ensureDatafileIntegrityAsync = async filename => {
  const tempFilename = filename + '~'

  const filenameExists = await existsAsync(filename)
  // Write was successful
  if (filenameExists) return

  const oldFilenameExists = await existsAsync(tempFilename)
  // New database
  if (!oldFilenameExists) await writeFileAsync(filename, '', 'utf8')
  // Write failed, use old version
  else await renameAsync(tempFilename, filename)
}

// Interface
module.exports.exists = exists
module.exports.existsAsync = existsAsync

module.exports.rename = rename
module.exports.renameAsync = renameAsync

module.exports.writeFile = writeFile
module.exports.writeFileAsync = writeFileAsync

module.exports.writeFileLines = writeFileLines
module.exports.writeFileLinesAsync = writeFileLinesAsync

module.exports.crashSafeWriteFileLines = crashSafeWriteFileLines
module.exports.crashSafeWriteFileLinesAsync = crashSafeWriteFileLinesAsync

module.exports.appendFile = appendFile
module.exports.appendFileAsync = appendFileAsync

module.exports.readFile = readFile
module.exports.readFileAsync = readFileAsync

module.exports.unlink = unlink
module.exports.unlinkAsync = unlinkAsync

module.exports.mkdir = mkdir
module.exports.mkdirAsync = mkdirAsync

module.exports.readFileStream = writeFileStream
module.exports.readFileStream = readFileStream

module.exports.flushToStorage = flushToStorage
module.exports.flushToStorageAsync = flushToStorageAsync

module.exports.ensureDatafileIntegrity = ensureDatafileIntegrity
module.exports.ensureDatafileIntegrityAsync = ensureDatafileIntegrityAsync

module.exports.ensureFileDoesntExist = ensureFileDoesntExist
module.exports.ensureFileDoesntExistAsync = ensureFileDoesntExistAsync
