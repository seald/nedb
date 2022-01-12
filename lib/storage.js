/**
 * Way data is stored for this database
 * For a Node.js/Node Webkit database it's the file system
 * For a browser-side database it's localforage which chooses the best option depending on user browser (IndexedDB then WebSQL then localStorage)
 *
 * This version is the Node.js/Node Webkit version
 * It's essentially fs, mkdirp and crash safe write and read functions
 */
const fs = require('fs')
const path = require('path')
const async = require('async')
const storage = {}
const { Readable } = require('stream')

// eslint-disable-next-line node/no-callback-literal
storage.exists = (path, cb) => fs.access(path, fs.constants.F_OK, (err) => { cb(!err) })
storage.rename = fs.rename
storage.writeFile = fs.writeFile
storage.unlink = fs.unlink
storage.appendFile = fs.appendFile
storage.readFile = fs.readFile
storage.readFileStream = fs.createReadStream
storage.mkdir = fs.mkdir

/**
 * Explicit name ...
 */
storage.ensureFileDoesntExist = (file, callback) => {
  storage.exists(file, exists => {
    if (!exists) return callback(null)

    storage.unlink(file, err => callback(err))
  })
}

/**
 * Flush data in OS buffer to storage if corresponding option is set
 * @param {String} options.filename
 * @param {Boolean} options.isDir Optional, defaults to false
 * If options is a string, it is assumed that the flush of the file (not dir) called options was requested
 */
storage.flushToStorage = (options, callback) => {
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

  fs.open(filename, flags, (err, fd) => {
    if (err) {
      return callback((err.code === 'EISDIR' && options.isDir) ? null : err)
    }
    fs.fsync(fd, errFS => {
      fs.close(fd, errC => {
        if ((errFS || errC) && !((errFS.code === 'EPERM' || errFS.code === 'EISDIR') && options.isDir)) {
          const e = new Error('Failed to flush to storage')
          e.errorOnFsync = errFS
          e.errorOnClose = errC
          return callback(e)
        } else {
          return callback(null)
        }
      })
    })
  })
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

/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)
 * @param {String} filename
 * @param {String[]} lines
 * @param {Function} callback Optional callback, signature: err
 */
storage.crashSafeWriteFileLines = (filename, lines, callback = () => {}) => {
  const tempFilename = filename + '~'

  async.waterfall([
    async.apply(storage.flushToStorage, { filename: path.dirname(filename), isDir: true }),
    cb => {
      storage.exists(filename, exists => {
        if (exists) storage.flushToStorage(filename, err => cb(err))
        else return cb()
      })
    },
    cb => {
      storage.writeFileLines(tempFilename, lines, cb)
    },
    async.apply(storage.flushToStorage, tempFilename),
    cb => {
      storage.rename(tempFilename, filename, err => cb(err))
    },
    async.apply(storage.flushToStorage, { filename: path.dirname(filename), isDir: true })
  ], err => callback(err))
}

/**
 * Ensure the datafile contains all the data, even if there was a crash during a full file write
 * @param {String} filename
 * @param {Function} callback signature: err
 */
storage.ensureDatafileIntegrity = (filename, callback) => {
  const tempFilename = filename + '~'

  storage.exists(filename, filenameExists => {
    // Write was successful
    if (filenameExists) return callback(null)

    storage.exists(tempFilename, oldFilenameExists => {
      // New database
      if (!oldFilenameExists) return storage.writeFile(filename, '', 'utf8', err => { callback(err) })

      // Write failed, use old version
      storage.rename(tempFilename, filename, err => callback(err))
    })
  })
}

// Interface
module.exports = storage
