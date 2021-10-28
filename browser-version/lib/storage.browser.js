/**
 * Way data is stored for this database
 * For a Node.js/Node Webkit database it's the file system
 * For a browser-side database it's localforage, which uses the best backend available (IndexedDB then WebSQL then localStorage)
 * For a react-native database, we use @react-native-async-storage/async-storage
 *
 * This version is the browser version
 */
const localforage = require('localforage')

// Configure localforage to display NeDB name for now. Would be a good idea to let user use his own app name
const store = localforage.createInstance({
  name: 'NeDB',
  storeName: 'nedbdata'
})

const exists = (filename, cback) => {
  // eslint-disable-next-line node/handle-callback-err
  store.getItem(filename, (err, value) => {
    if (value !== null) return cback(true) // Even if value is undefined, localforage returns null
    else return cback(false)
  })
}

const rename = (filename, newFilename, callback) => {
  // eslint-disable-next-line node/handle-callback-err
  store.getItem(filename, (err, value) => {
    if (value === null) store.removeItem(newFilename, () => callback())
    else {
      store.setItem(newFilename, value, () => {
        store.removeItem(filename, () => callback())
      })
    }
  })
}

const writeFile = (filename, contents, options, callback) => {
  // Options do not matter in browser setup
  if (typeof options === 'function') { callback = options }
  store.setItem(filename, contents, () => callback())
}

const appendFile = (filename, toAppend, options, callback) => {
  // Options do not matter in browser setup
  if (typeof options === 'function') { callback = options }

  // eslint-disable-next-line node/handle-callback-err
  store.getItem(filename, (err, contents) => {
    contents = contents || ''
    contents += toAppend
    store.setItem(filename, contents, () => callback())
  })
}

const readFile = (filename, options, callback) => {
  // Options do not matter in browser setup
  if (typeof options === 'function') { callback = options }
  // eslint-disable-next-line node/handle-callback-err
  store.getItem(filename, (err, contents) => callback(null, contents || ''))
}

const unlink = (filename, callback) => {
  store.removeItem(filename, () => callback())
}

// Nothing to do, no directories will be used on the browser
const mkdir = (dir, options, callback) => callback()

// Nothing to do, no data corruption possible in the browser
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
