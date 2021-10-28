/**
 * Way data is stored for this database
 * For a Node.js/Node Webkit database it's the file system
 * For a browser-side database it's localforage, which uses the best backend available (IndexedDB then WebSQL then localStorage)
 * For a react-native database, we use @react-native-async-storage/async-storage
 *
 * This version is the react-native version
 */
const AsyncStorage = require('@react-native-async-storage/async-storage').default

const exists = (filename, cback) => {
  // eslint-disable-next-line node/handle-callback-err
  AsyncStorage.getItem(filename, (err, value) => {
    if (value !== null) {
      return cback(true)
    } else {
      return cback(false)
    }
  })
}

const rename = (filename, newFilename, callback) => {
  // eslint-disable-next-line node/handle-callback-err
  AsyncStorage.getItem(filename, (err, value) => {
    if (value === null) {
      this.storage.removeItem(newFilename, callback)
    } else {
      this.storage.setItem(newFilename, value, () => {
        this.storage.removeItem(filename, callback)
      })
    }
  })
}

const writeFile = (filename, contents, options, callback) => {
  // Options do not matter in a react-native setup
  if (typeof options === 'function') { callback = options }
  AsyncStorage.setItem(filename, contents, callback)
}

const appendFile = (filename, toAppend, options, callback) => {
  // Options do not matter in a react-native setup
  if (typeof options === 'function') { callback = options }

  // eslint-disable-next-line node/handle-callback-err
  AsyncStorage.getItem(filename, (err, contents) => {
    contents = contents || ''
    contents += toAppend
    AsyncStorage.setItem(filename, contents, callback)
  })
}

const readFile = (filename, options, callback) => {
  // Options do not matter in a react-native setup
  if (typeof options === 'function') { callback = options }
  // eslint-disable-next-line node/handle-callback-err
  AsyncStorage.getItem(filename, (err, contents) => {
    return callback(null, contents || '')
  })
}

const unlink = (filename, callback) => {
  AsyncStorage.removeItem(filename, callback)
}

// Nothing to do, no directories will be used on react-native
const mkdir = (dir, options, callback) => callback()

// Nothing to do, no data corruption possible on react-native
const ensureDatafileIntegrity = (filename, callback) => callback(null)

const crashSafeWriteFileLines = (filename, lines, callback) => {
  lines.push('') // Add final new line
  writeFile(filename, lines.join('\n'), callback)
}

// Interface
module.exports.exists = exists
module.exports.rename = rename
module.exports.writeFile = writeFile
module.exports.crashSafeWriteFileLines = crashSafeWriteFileLines
module.exports.appendFile = appendFile
module.exports.readFile = readFile
module.exports.unlink = unlink
module.exports.mkdir = mkdir
module.exports.ensureDatafileIntegrity = ensureDatafileIntegrity
