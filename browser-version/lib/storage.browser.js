/**
 * Way data is stored for this database
 * For a Node.js/Node Webkit database it's the file system
 * For a browser-side database it's localforage, which uses the best backend available (IndexedDB then WebSQL then localStorage)
 * For a react-native database, we use @react-native-async-storage/async-storage
 *
 * This version is the browser version
 */
const localforage = require('localforage')
const { callbackify } = require('util')

// Configure localforage to display NeDB name for now. Would be a good idea to let user use his own app name
const store = localforage.createInstance({
  name: 'NeDB',
  storeName: 'nedbdata'
})

const existsAsync = async filename => {
  try {
    const value = await store.getItem(filename)
    if (value !== null) return true // Even if value is undefined, localforage returns null
    return false
  } catch (error) {
    return false
  }
}

const exists = callbackify(existsAsync)

const renameAsync = async (filename, newFilename) => {
  try {
    const value = await store.getItem(filename)
    if (value === null) await store.removeItem(newFilename)
    else {
      await store.setItem(newFilename, value)
      await store.removeItem(filename)
    }
  } catch (err) {
    console.warn('An error happened while renaming, skip')
  }
}

const rename = callbackify(renameAsync)

const writeFileAsync = async (filename, contents, options) => {
  // Options do not matter in browser setup
  try {
    await store.setItem(filename, contents)
  } catch (error) {
    console.warn('An error happened while writing, skip')
  }
}

const writeFile = callbackify(writeFileAsync)

const appendFileAsync = async (filename, toAppend, options) => {
  // Options do not matter in browser setup
  try {
    const contents = (await store.getItem(filename)) || ''
    await store.setItem(filename, contents + toAppend)
  } catch (error) {
    console.warn('An error happened appending to file writing, skip')
  }
}

const appendFile = callbackify(appendFileAsync)

const readFileAsync = async (filename, options) => {
  try {
    return (await store.getItem(filename)) || ''
  } catch (error) {
    console.warn('An error happened while reading, skip')
    return ''
  }
}

const readFile = callbackify(readFileAsync)

const unlinkAsync = async filename => {
  try {
    await store.removeItem(filename)
  } catch (error) {
    console.warn('An error happened while unlinking, skip')
  }
}

const unlink = callbackify(unlinkAsync)

// Nothing to do, no directories will be used on the browser
const mkdirAsync = (dir, options) => Promise.resolve()

const mkdir = callbackify(mkdirAsync)

// Nothing to do, no data corruption possible in the browser
const ensureDatafileIntegrityAsync = (filename) => Promise.resolve()

const ensureDatafileIntegrity = callbackify(ensureDatafileIntegrityAsync)

const crashSafeWriteFileLinesAsync = async (filename, lines) => {
  lines.push('') // Add final new line
  await writeFileAsync(filename, lines.join('\n'))
}

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
