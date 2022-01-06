/**
 * Way data is stored for this database
 * For a Node.js/Node Webkit database it's the file system
 * For a browser-side database it's localforage, which uses the best backend available (IndexedDB then WebSQL then localStorage)
 * For a react-native database, we use @react-native-async-storage/async-storage
 *
 * This version is the react-native version
 * @module storageReactNative
 */
const AsyncStorage = require('@react-native-async-storage/async-storage').default
const { callbackify } = require('util') // TODO: util is not a dependency, this would fail if util is not polyfilled

/**
 * Returns Promise<true> if file exists
 * @param {string} file
 * @return {Promise<boolean>}
 * @async
 * @alias module:storageReactNative.existsAsync
 */
const existsAsync = async file => {
  try {
    const value = await AsyncStorage.getItem(file)
    if (value !== null) return true // Even if value is undefined, localforage returns null
    return false
  } catch (error) {
    return false
  }
}
/**
 * @callback module:storageReactNative~existsCallback
 * @param {boolean} exists
 */

/**
 * Callback returns true if file exists
 * @function
 * @param {string} file
 * @param {module:storageReactNative~existsCallback} cb
 * @alias module:storageReactNative.exists
 */
const exists = callbackify(existsAsync)

/**
 * Moves the item from one path to another
 * @param {string} oldPath
 * @param {string} newPath
 * @return {Promise<void>}
 * @alias module:storageReactNative.renameAsync
 * @async
 */
const renameAsync = async (oldPath, newPath) => {
  try {
    const value = await AsyncStorage.getItem(oldPath)
    if (value === null) await AsyncStorage.removeItem(newPath)
    else {
      await AsyncStorage.setItem(newPath, value)
      await AsyncStorage.removeItem(oldPath)
    }
  } catch (err) {
    console.warn('An error happened while renaming, skip')
  }
}

/**
 * Moves the item from one path to another
 * @function
 * @param {string} oldPath
 * @param {string} newPath
 * @param {NoParamCallback} c
 * @return {void}
 * @alias module:storageReactNative.rename
 */
const rename = callbackify(renameAsync)

/**
 * Saves the item at given path
 * @param {string} file
 * @param {string} data
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storageReactNative.writeFileAsync
 * @async
 */
const writeFileAsync = async (file, data, options) => {
  // Options do not matter in browser setup
  try {
    await AsyncStorage.setItem(file, data)
  } catch (error) {
    console.warn('An error happened while writing, skip')
  }
}

/**
 * Saves the item at given path
 * @function
 * @param {string} path
 * @param {string} data
 * @param {object} options
 * @param {function} callback
 * @alias module:storageReactNative.writeFile
 */
const writeFile = callbackify(writeFileAsync)

/**
 * Append to the item at given path
 * @function
 * @param {string} filename
 * @param {string} toAppend
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storageReactNative.appendFileAsync
 * @async
 */
const appendFileAsync = async (filename, toAppend, options) => {
  // Options do not matter in browser setup
  try {
    const contents = (await AsyncStorage.getItem(filename)) || ''
    await AsyncStorage.setItem(filename, contents + toAppend)
  } catch (error) {
    console.warn('An error happened appending to file writing, skip')
  }
}

/**
 * Append to the item at given path
 * @function
 * @param {string} filename
 * @param {string} toAppend
 * @param {object} [options]
 * @param {function} callback
 * @alias module:storageReactNative.appendFile
 */
const appendFile = callbackify(appendFileAsync)

/**
 * Read data at given path
 * @function
 * @param {string} filename
 * @param {object} [options]
 * @return {Promise<string>}
 * @alias module:storageReactNative.readFileAsync
 * @async
 */
const readFileAsync = async (filename, options) => {
  try {
    return (await AsyncStorage.getItem(filename)) || ''
  } catch (error) {
    console.warn('An error happened while reading, skip')
    return ''
  }
}

/**
 * Read data at given path
 * @function
 * @param {string} filename
 * @param {object} options
 * @param {function} callback
 * @alias module:storageReactNative.readFile
 */
const readFile = callbackify(readFileAsync)

/**
 * Remove the data at given path
 * @function
 * @param {string} filename
 * @return {Promise<void>}
 * @async
 * @alias module:storageReactNative.unlinkAsync
 */
const unlinkAsync = async filename => {
  try {
    await AsyncStorage.removeItem(filename)
  } catch (error) {
    console.warn('An error happened while unlinking, skip')
  }
}

/**
 * Remove the data at given path
 * @function
 * @param {string} path
 * @param {function} callback
 * @alias module:storageReactNative.unlink
 */
const unlink = callbackify(unlinkAsync)

/**
 * Shim for storage.mkdirAsync, nothing to do, no directories will be used on the browser
 * @function
 * @param {string} dir
 * @param {object} [options]
 * @return {Promise<void|string>}
 * @alias module:storageReactNative.mkdirAsync
 * @async
 */
const mkdirAsync = (dir, options) => Promise.resolve()

/**
 * Shim for storage.mkdir, nothing to do, no directories will be used on the browser
 * @function
 * @param {string} path
 * @param {object} options
 * @param {function} callback
 * @alias module:storageReactNative.mkdir
 */
const mkdir = callbackify(mkdirAsync)

/**
 * Ensure the datafile contains all the data, even if there was a crash during a full file write
 * Nothing to do, no data corruption possible in the browser
 * @param {string} filename
 * @return {Promise<void>}
 * @alias module:storageReactNative.ensureDatafileIntegrityAsync
 */
const ensureDatafileIntegrityAsync = (filename) => Promise.resolve()

/**
 * Ensure the datafile contains all the data, even if there was a crash during a full file write
 * Nothing to do, no data corruption possible in the browser
 * @function
 * @param {string} filename
 * @param {NoParamCallback} callback signature: err
 * @alias module:storageReactNative.ensureDatafileIntegrity
 */
const ensureDatafileIntegrity = callbackify(ensureDatafileIntegrityAsync)

/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)
 * @param {string} filename
 * @param {string[]} lines
 * @return {Promise<void>}
 * @alias module:storageReactNative.crashSafeWriteFileLinesAsync
 */
const crashSafeWriteFileLinesAsync = async (filename, lines) => {
  lines.push('') // Add final new line
  await writeFileAsync(filename, lines.join('\n'))
}

/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)
 * @function
 * @param {string} filename
 * @param {string[]} lines
 * @param {NoParamCallback} [callback] Optional callback, signature: err
 * @alias module:storageReactNative.crashSafeWriteFileLines
 */
const crashSafeWriteFileLines = callbackify(crashSafeWriteFileLinesAsync)

// Interface
module.exports.exists = exists
module.exports.existsAsync = existsAsync

module.exports.rename = rename
module.exports.renameAsync = renameAsync

module.exports.writeFile = writeFile
module.exports.writeFileAsync = writeFileAsync

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

module.exports.ensureDatafileIntegrity = ensureDatafileIntegrity
module.exports.ensureDatafileIntegrityAsync = ensureDatafileIntegrityAsync
