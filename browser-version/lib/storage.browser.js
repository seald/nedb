/**
 * Way data is stored for this database
 * For a Node.js/Node Webkit database it's the file system
 * For a browser-side database it's localforage which chooses the best option depending on user browser (IndexedDB then WebSQL then localStorage)
 *
 * This version is the browser version
 * @module storageBrowser
 */

const localforage = require('localforage')
const { callbackify } = require('util') // TODO: util is not a dependency, this would fail if util is not polyfilled

// Configure localforage to display NeDB name for now. Would be a good idea to let user use his own app name
const store = localforage.createInstance({
  name: 'NeDB',
  storeName: 'nedbdata'
})

/**
 * Returns Promise<true> if file exists
 * @param {string} file
 * @return {Promise<boolean>}
 * @async
 * @alias module:storageBrowser.existsAsync
 */
const existsAsync = async file => {
  try {
    const value = await store.getItem(file)
    if (value !== null) return true // Even if value is undefined, localforage returns null
    return false
  } catch (error) {
    return false
  }
}

/**
 * @callback module:storageBrowser~existsCallback
 * @param {boolean} exists
 */

/**
 * Callback returns true if file exists
 * @function
 * @param {string} file
 * @param {module:storageBrowser~existsCallback} cb
 * @alias module:storageBrowser.exists
 */
const exists = callbackify(existsAsync)

/**
 * Moves the item from one path to another
 * @param {string} oldPath
 * @param {string} newPath
 * @return {Promise<void>}
 * @alias module:storageBrowser.renameAsync
 * @async
 */
const renameAsync = async (oldPath, newPath) => {
  try {
    const value = await store.getItem(oldPath)
    if (value === null) await store.removeItem(newPath)
    else {
      await store.setItem(newPath, value)
      await store.removeItem(oldPath)
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
 * @alias module:storageBrowser.rename
 */
const rename = callbackify(renameAsync)

/**
 * Saves the item at given path
 * @param {string} file
 * @param {string} data
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storageBrowser.writeFileAsync
 * @async
 */
const writeFileAsync = async (file, data, options) => {
  // Options do not matter in browser setup
  try {
    await store.setItem(file, data)
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
 * @alias module:storageBrowser.writeFile
 */
const writeFile = callbackify(writeFileAsync)

/**
 * Append to the item at given path
 * @function
 * @param {string} filename
 * @param {string} toAppend
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storageBrowser.appendFileAsync
 * @async
 */
const appendFileAsync = async (filename, toAppend, options) => {
  // Options do not matter in browser setup
  try {
    const contents = (await store.getItem(filename)) || ''
    await store.setItem(filename, contents + toAppend)
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
 * @alias module:storageBrowser.appendFile
 */
const appendFile = callbackify(appendFileAsync)

/**
 * Read data at given path
 * @function
 * @param {string} filename
 * @param {object} [options]
 * @return {Promise<Buffer>}
 * @alias module:storageBrowser.readFileAsync
 * @async
 */
const readFileAsync = async (filename, options) => {
  try {
    return (await store.getItem(filename)) || ''
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
 * @alias module:storageBrowser.readFile
 */
const readFile = callbackify(readFileAsync)

/**
 * Remove the data at given path
 * @function
 * @param {string} filename
 * @return {Promise<void>}
 * @async
 * @alias module:storageBrowser.unlinkAsync
 */
const unlinkAsync = async filename => {
  try {
    await store.removeItem(filename)
  } catch (error) {
    console.warn('An error happened while unlinking, skip')
  }
}

/**
 * Remove the data at given path
 * @function
 * @param {string} path
 * @param {function} callback
 * @alias module:storageBrowser.unlink
 */
const unlink = callbackify(unlinkAsync)

/**
 * Shim for storage.mkdirAsync, nothing to do, no directories will be used on the browser
 * @function
 * @param {string} path
 * @param {object} [options]
 * @return {Promise<void|string>}
 * @alias module:storageBrowser.mkdirAsync
 * @async
 */
const mkdirAsync = (path, options) => Promise.resolve()
/**
 * Shim for storage.mkdir, nothing to do, no directories will be used on the browser
 * @function
 * @param {string} path
 * @param {object} options
 * @param {function} callback
 * @alias module:storageBrowser.mkdir
 */
const mkdir = callbackify(mkdirAsync)

/**
 * Ensure the datafile contains all the data, even if there was a crash during a full file write
 * Nothing to do, no data corruption possible in the browser
 * @param {string} filename
 * @return {Promise<void>}
 * @alias module:storageBrowser.ensureDatafileIntegrityAsync
 */
const ensureDatafileIntegrityAsync = (filename) => Promise.resolve()

/**
 * Ensure the datafile contains all the data, even if there was a crash during a full file write
 * Nothing to do, no data corruption possible in the browser
 * @function
 * @param {string} filename
 * @param {NoParamCallback} callback signature: err
 * @alias module:storageBrowser.ensureDatafileIntegrity
 */
const ensureDatafileIntegrity = callbackify(ensureDatafileIntegrityAsync)

/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)
 * @param {string} filename
 * @param {string[]} lines
 * @return {Promise<void>}
 * @alias module:storageBrowser.crashSafeWriteFileLinesAsync
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
 * @alias module:storageBrowser.crashSafeWriteFileLines
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
