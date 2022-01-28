/**
 * Way data is stored for this database
 *
 * This version is the React-Native version and uses [@react-native-async-storage/async-storage]{@link https://github.com/react-native-async-storage/async-storage}.
 * @module storageReactNative
 * @see module:storageBrowser
 * @see module:storage
 * @private
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default
const { callbackify } = require('util')

/**
 * Async version of {@link module:storageReactNative.exists}.
 * @param {string} file
 * @return {Promise<boolean>}
 * @async
 * @alias module:storageReactNative.existsAsync
 * @see module:storageReactNative.exists
 */
const existsAsync = async file => {
  try {
    const value = await AsyncStorage.getItem(file)
    if (value !== null) return true // Even if value is undefined, AsyncStorage returns null
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
 * Async version of {@link module:storageReactNative.rename}.
 * @param {string} oldPath
 * @param {string} newPath
 * @return {Promise<void>}
 * @alias module:storageReactNative.renameAsync
 * @async
 * @see module:storageReactNative.rename
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
 * Async version of {@link module:storageReactNative.writeFile}.
 * @param {string} file
 * @param {string} data
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storageReactNative.writeFileAsync
 * @async
 * @see module:storageReactNative.writeFile
 */
const writeFileAsync = async (file, data, options) => {
  // Options do not matter in react-native setup
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
 * Async version of {@link module:storageReactNative.appendFile}.
 * @function
 * @param {string} filename
 * @param {string} toAppend
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storageReactNative.appendFileAsync
 * @async
 * @see module:storageReactNative.appendFile
 */
const appendFileAsync = async (filename, toAppend, options) => {
  // Options do not matter in react-native setup
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
 * Async version of {@link module:storageReactNative.readFile}.
 * @function
 * @param {string} filename
 * @param {object} [options]
 * @return {Promise<string>}
 * @alias module:storageReactNative.readFileAsync
 * @async
 * @see module:storageReactNative.readFile
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
 * Async version of {@link module:storageReactNative.unlink}.
 * @function
 * @param {string} filename
 * @return {Promise<void>}
 * @async
 * @alias module:storageReactNative.unlinkAsync
 * @see module:storageReactNative.unlink
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
 * Shim for {@link module:storage.mkdirAsync}, nothing to do, no directories will be used on the react-native.
 * @function
 * @param {string} dir
 * @param {object} [options]
 * @return {Promise<void|string>}
 * @alias module:storageReactNative.mkdirAsync
 * @async
 */
const mkdirAsync = (dir, options) => Promise.resolve()

/**
 * Shim for {@link module:storage.mkdir}, nothing to do, no directories will be used on the react-native.
 * @function
 * @param {string} path
 * @param {object} options
 * @param {function} callback
 * @alias module:storageReactNative.mkdir
 */
const mkdir = callbackify(mkdirAsync)

/**
 * Shim for {@link module:storage.ensureDatafileIntegrityAsync}, nothing to do, no data corruption possible in the react-native.
 * @param {string} filename
 * @return {Promise<void>}
 * @alias module:storageReactNative.ensureDatafileIntegrityAsync
 */
const ensureDatafileIntegrityAsync = (filename) => Promise.resolve()

/**
 * Shim for {@link module:storage.ensureDatafileIntegrity}, nothing to do, no data corruption possible in the react-native.
 * @function
 * @param {string} filename
 * @param {NoParamCallback} callback signature: err
 * @alias module:storageReactNative.ensureDatafileIntegrity
 */
const ensureDatafileIntegrity = callbackify(ensureDatafileIntegrityAsync)

/**
 * Async version of {@link module:storageReactNative.crashSafeWriteFileLines}.
 * @param {string} filename
 * @param {string[]} lines
 * @return {Promise<void>}
 * @alias module:storageReactNative.crashSafeWriteFileLinesAsync
 * @see module:storageReactNative.crashSafeWriteFileLines
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
