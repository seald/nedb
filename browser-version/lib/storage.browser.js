/**
 * Way data is stored for this database
 *
 * This version is the browser version and uses [localforage]{@link https://github.com/localForage/localForage} which chooses the best option depending on user browser (IndexedDB then WebSQL then localStorage).
 * @module storageBrowser
 * @see module:storage
 * @see module:storageReactNative
 * @private
 */

const localforage = require('localforage')

// Configure localforage to display NeDB name for now. Would be a good idea to let user use his own app name
const store = localforage.createInstance({
  name: 'NeDB',
  storeName: 'nedbdata'
})

/**
 * Returns Promise<true> if file exists.
 *
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
    console.warn('NeDB - storage.browser - existsAsync:', error)
    return false
  }
}

/**
 * Moves the item from one path to another.
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
    console.warn('NeDB - storage.browser - renameAsync:', err)
    console.warn('An error happened while renaming, skip')
  }
}

/**
 * Saves the item at given path.
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
    console.warn('NeDB - storage.browser - writeFileAsync:', error)
    console.warn('An error happened while writing, skip')
  }
}

/**
 * Append to the item at given path.
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
    console.warn('NeDB - storage.browser - appendFileAsync:', error)
    console.warn('An error happened appending to file writing, skip')
  }
}

/**
 * Read data at given path.
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
    console.warn('NeDB - storage.browser - readFileAsync:', error)
    console.warn('An error happened while reading, skip')
    return ''
  }
}

/**
 * Async version of {@link module:storageBrowser.unlink}.
 * @function
 * @param {string} filename
 * @return {Promise<void>}
 * @async
 * @alias module:storageBrowser.unlink
 */
const unlinkAsync = async filename => {
  try {
    await store.removeItem(filename)
  } catch (error) {
    console.warn('NeDB - storage.browser - unlinkAsync:', error)
    console.warn('An error happened while unlinking, skip')
  }
}

/**
 * Shim for {@link module:storage.mkdirAsync}, nothing to do, no directories will be used on the browser.
 * @function
 * @param {string} path
 * @param {object} [options]
 * @return {Promise<void|string>}
 * @alias module:storageBrowser.mkdirAsync
 * @async
 */
const mkdirAsync = (path, options) => Promise.resolve()

/**
 * Shim for {@link module:storage.ensureParentDirectoryExistsAsync}, nothing to do, no directories will be used on the browser.
 * @function
 * @param {string} file
 * @param {number} [mode]
 * @return {Promise<void|string>}
 * @alias module:storageBrowser.ensureParentDirectoryExistsAsync
 * @async
 */
const ensureParentDirectoryExistsAsync = async (file, mode) => Promise.resolve()

/**
 * Shim for {@link module:storage.ensureDatafileIntegrityAsync}, nothing to do, no data corruption possible in the browser.
 * @param {string} filename
 * @return {Promise<void>}
 * @alias module:storageBrowser.ensureDatafileIntegrityAsync
 */
const ensureDatafileIntegrityAsync = (filename) => Promise.resolve()

/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)
 * * @param {string} filename
 * @param {string[]} lines
 * @return {Promise<void>}
 * @alias module:storageBrowser.crashSafeWriteFileLinesAsync
 */
const crashSafeWriteFileLinesAsync = async (filename, lines) => {
  lines.push('') // Add final new line
  await writeFileAsync(filename, lines.join('\n'))
}

// Interface
module.exports.existsAsync = existsAsync

module.exports.renameAsync = renameAsync

module.exports.writeFileAsync = writeFileAsync

module.exports.crashSafeWriteFileLinesAsync = crashSafeWriteFileLinesAsync

module.exports.appendFileAsync = appendFileAsync

module.exports.readFileAsync = readFileAsync

module.exports.unlinkAsync = unlinkAsync

module.exports.mkdirAsync = mkdirAsync

module.exports.ensureDatafileIntegrityAsync = ensureDatafileIntegrityAsync

module.exports.ensureParentDirectoryExistsAsync = ensureParentDirectoryExistsAsync
