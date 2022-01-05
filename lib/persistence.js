/**
 * Handle every persistence-related task
 * The interface Datastore expects to be implemented is
 * * Persistence.loadDatabase(callback) and callback has signature err
 * * Persistence.persistNewState(newDocs, callback) where newDocs is an array of documents and callback has signature err
 */
const path = require('path')
const { callbackify, promisify, deprecate } = require('util')
const byline = require('./byline')
const customUtils = require('./customUtils.js')
const Index = require('./indexes.js')
const model = require('./model.js')
const storage = require('./storage.js')

class Persistence {
  /**
   * Create a new Persistence object for database options.db
   * @param {Datastore} options.db
   * @param {Number} [options.corruptAlertThreshold] Optional, threshold after which an alert is thrown if too much data is corrupt
   * @param {string} [options.nodeWebkitAppName] Optional, specify the name of your NW app if you want options.filename to be relative to the directory where Node Webkit stores application data such as cookies and local storage (the best place to store data in my opinion)
   */
  constructor (options) {
    this.db = options.db
    this.inMemoryOnly = this.db.inMemoryOnly
    this.filename = this.db.filename
    this.corruptAlertThreshold = options.corruptAlertThreshold !== undefined ? options.corruptAlertThreshold : 0.1

    if (
      !this.inMemoryOnly &&
      this.filename &&
      this.filename.charAt(this.filename.length - 1) === '~'
    ) throw new Error('The datafile name can\'t end with a ~, which is reserved for crash safe backup files')

    // After serialization and before deserialization hooks with some basic sanity checks
    if (
      options.afterSerialization &&
      !options.beforeDeserialization
    ) throw new Error('Serialization hook defined but deserialization hook undefined, cautiously refusing to start NeDB to prevent dataloss')
    if (
      !options.afterSerialization &&
      options.beforeDeserialization
    ) throw new Error('Serialization hook undefined but deserialization hook defined, cautiously refusing to start NeDB to prevent dataloss')

    this.afterSerialization = options.afterSerialization || (s => s)
    this.beforeDeserialization = options.beforeDeserialization || (s => s)

    for (let i = 1; i < 30; i += 1) {
      for (let j = 0; j < 10; j += 1) {
        const randomString = customUtils.uid(i)
        if (this.beforeDeserialization(this.afterSerialization(randomString)) !== randomString) {
          throw new Error('beforeDeserialization is not the reverse of afterSerialization, cautiously refusing to start NeDB to prevent dataloss')
        }
      }
    }

    // For NW apps, store data in the same directory where NW stores application data
    if (this.filename && options.nodeWebkitAppName) {
      deprecate(() => {
        this.filename = Persistence.getNWAppFilename(options.nodeWebkitAppName, this.filename)
      }, 'The nodeWebkitAppName option is deprecated and will be removed in the next version. To get the path to the directory where Node Webkit stores the data for your app, use the internal nw.gui module like this require(\'nw.gui\').App.dataPath See https://github.com/rogerwang/node-webkit/issues/500')()
    }
  }

  /**
   * @callback Persistence~persistCachedDatabaseCallback
   * @param {Error?} err
   */

  /**
   * Persist cached database
   * This serves as a compaction function since the cache always contains only the number of documents in the collection
   * while the data file is append-only so it may grow larger
   * This is an internal function, use compactDataFile which uses the executor
   * @param {Persistence~persistCachedDatabaseCallback} callback Optional callback, signature: err
   */
  persistCachedDatabase (callback = () => {}) {
    return callbackify(this.persistCachedDatabaseAsync.bind(this))(callback)
  }

  /**
   * Persist cached database
   * This serves as a compaction function since the cache always contains only the number of documents in the collection
   * while the data file is append-only so it may grow larger
   * This is an internal function, use compactDataFileAsync which uses the executor
   * @return {Promise<void>}
   */
  async persistCachedDatabaseAsync () {
    const lines = []

    if (this.inMemoryOnly) return

    this.db.getAllData().forEach(doc => {
      lines.push(this.afterSerialization(model.serialize(doc)))
    })
    Object.keys(this.db.indexes).forEach(fieldName => {
      if (fieldName !== '_id') { // The special _id index is managed by datastore.js, the others need to be persisted
        lines.push(this.afterSerialization(model.serialize({
          $$indexCreated: {
            fieldName: fieldName,
            unique: this.db.indexes[fieldName].unique,
            sparse: this.db.indexes[fieldName].sparse
          }
        })))
      }
    })

    await storage.crashSafeWriteFileLinesAsync(this.filename, lines)
    this.db.emit('compaction.done')
  }

  /**
   * @callback Persistence~compactDataFileCallback
   * @param {Error?} err
   */

  /**
   * Queue a rewrite of the datafile
   * @param {Persistence~compactDataFileCallback} [callback = () => {}] Optional callback, signature: err
   */
  compactDatafile (callback = () => {}) {
    this.db.executor.push({ this: this, fn: this.persistCachedDatabase, arguments: [callback] })
  }

  /**
   * Queue a rewrite of the datafile
   * @async
   */
  compactDatafileAsync () {
    return this.db.executor.pushAsync(() => this.persistCachedDatabaseAsync())
  }

  /**
   * Set automatic compaction every interval ms
   * @param {Number} interval in milliseconds, with an enforced minimum of 5 seconds
   */
  setAutocompactionInterval (interval) {
    const minInterval = 5000
    const realInterval = Math.max(interval || 0, minInterval)

    this.stopAutocompaction()

    this.autocompactionIntervalId = setInterval(() => {
      this.compactDatafile()
    }, realInterval)
  }

  /**
   * Stop autocompaction (do nothing if autocompaction was not running)
   */
  stopAutocompaction () {
    if (this.autocompactionIntervalId) clearInterval(this.autocompactionIntervalId)
  }

  /**
   * @callback Persistence~persistNewStateCallback
   * @param {Error?} err
   */

  /**
   * Persist new state for the given newDocs (can be insertion, update or removal)
   * Use an append-only format
   * @param {string[]} newDocs Can be empty if no doc was updated/removed
   * @param {Persistence~persistNewStateCallback} [callback = () => {}] Optional, signature: err
   */
  persistNewState (newDocs, callback = () => {}) {
    callbackify(this.persistNewStateAsync.bind(this))(newDocs, err => callback(err))
  }

  /**
   * Persist new state for the given newDocs (can be insertion, update or removal)
   * Use an append-only format
   * @param {string[]} newDocs Can be empty if no doc was updated/removed
   * @return {Promise}
   */
  async persistNewStateAsync (newDocs) {
    let toPersist = ''

    // In-memory only datastore
    if (this.inMemoryOnly) return

    newDocs.forEach(doc => {
      toPersist += this.afterSerialization(model.serialize(doc)) + '\n'
    })

    if (toPersist.length === 0) return

    await storage.appendFileAsync(this.filename, toPersist, 'utf8')
  }

  /**
   * @typedef rawIndex
   * @property {string} fieldName
   * @property {boolean} [unique]
   * @property {boolean} [sparse]
   */

  /**
   * From a database's raw data, return the corresponding machine understandable collection
   * @param {string} rawData database file
   * @return {{data: document[], indexes: Object.<string, rawIndex>}}
   */
  treatRawData (rawData) {
    const data = rawData.split('\n')
    const dataById = {}
    const indexes = {}

    // Last line of every data file is usually blank so not really corrupt
    let corruptItems = -1

    for (const datum of data) {
      try {
        const doc = model.deserialize(this.beforeDeserialization(datum))
        if (doc._id) {
          if (doc.$$deleted === true) delete dataById[doc._id]
          else dataById[doc._id] = doc
        } else if (doc.$$indexCreated && doc.$$indexCreated.fieldName != null) indexes[doc.$$indexCreated.fieldName] = doc.$$indexCreated
        else if (typeof doc.$$indexRemoved === 'string') delete indexes[doc.$$indexRemoved]
      } catch (e) {
        corruptItems += 1
      }
    }

    // A bit lenient on corruption
    if (
      data.length > 0 &&
      corruptItems / data.length > this.corruptAlertThreshold
    ) throw new Error(`More than ${Math.floor(100 * this.corruptAlertThreshold)}% of the data file is corrupt, the wrong beforeDeserialization hook may be used. Cautiously refusing to start NeDB to prevent dataloss`)

    const tdata = Object.values(dataById)

    return { data: tdata, indexes: indexes }
  }

  /**
   * @callback Persistence~treatRawStreamCallback
   * @param {Error?} err
   * @param {{data: document[], indexes: Object.<string, rawIndex>}} data
   */

  /**
   * From a database's raw data stream, return the corresponding machine understandable collection
   * @param {Readable} rawStream
   * @param {Persistence~treatRawStreamCallback} cb
   */
  treatRawStream (rawStream, cb) {
    const dataById = {}
    const indexes = {}

    // Last line of every data file is usually blank so not really corrupt
    let corruptItems = -1

    const lineStream = byline(rawStream, { keepEmptyLines: true })
    let length = 0

    lineStream.on('data', (line) => {
      try {
        const doc = model.deserialize(this.beforeDeserialization(line))
        if (doc._id) {
          if (doc.$$deleted === true) delete dataById[doc._id]
          else dataById[doc._id] = doc
        } else if (doc.$$indexCreated && doc.$$indexCreated.fieldName != null) indexes[doc.$$indexCreated.fieldName] = doc.$$indexCreated
        else if (typeof doc.$$indexRemoved === 'string') delete indexes[doc.$$indexRemoved]
      } catch (e) {
        corruptItems += 1
      }

      length++
    })

    lineStream.on('end', () => {
      // A bit lenient on corruption
      if (length > 0 && corruptItems / length > this.corruptAlertThreshold) {
        const err = new Error(`More than ${Math.floor(100 * this.corruptAlertThreshold)}% of the data file is corrupt, the wrong beforeDeserialization hook may be used. Cautiously refusing to start NeDB to prevent dataloss`)
        cb(err, null)
        return
      }

      const data = Object.values(dataById)

      cb(null, { data, indexes: indexes })
    })

    lineStream.on('error', function (err) {
      cb(err)
    })
  }

  /**
   * From a database's raw data stream, return the corresponding machine understandable collection
   * @param {Readable} rawStream
   * @return {Promise<{data: document[], indexes: Object.<string, rawIndex>}>}
   * @async
   */
  treatRawStreamAsync (rawStream) {
    return promisify(this.treatRawStream.bind(this))(rawStream)
  }

  /**
   * @callback Persistence~loadDatabaseCallback
   * @param {Error?} err
   */

  /**
   * Load the database
   * 1) Create all indexes
   * 2) Insert all data
   * 3) Compact the database
   * This means pulling data out of the data file or creating it if it doesn't exist
   * Also, all data is persisted right away, which has the effect of compacting the database file
   * This operation is very quick at startup for a big collection (60ms for ~10k docs)
   * @param {Persistence~loadDatabaseCallback} callback Optional callback, signature: err
   */
  loadDatabase (callback = () => {}) {
    callbackify(this.loadDatabaseAsync.bind(this))(err => callback(err))
  }

  /**
   * Load the database
   * 1) Create all indexes
   * 2) Insert all data
   * 3) Compact the database
   * This means pulling data out of the data file or creating it if it doesn't exist
   * Also, all data is persisted right away, which has the effect of compacting the database file
   * This operation is very quick at startup for a big collection (60ms for ~10k docs)
   * @return {Promise<void>}
   */
  async loadDatabaseAsync () {
    this.db.resetIndexes()

    // In-memory only datastore
    if (this.inMemoryOnly) return
    await Persistence.ensureDirectoryExistsAsync(path.dirname(this.filename)) // TODO: maybe ignore error
    await storage.ensureDatafileIntegrityAsync(this.filename) // TODO: maybe ignore error

    let treatedData
    if (storage.readFileStream) {
      // Server side
      const fileStream = storage.readFileStream(this.filename, { encoding: 'utf8' })
      treatedData = await this.treatRawStreamAsync(fileStream)
    } else {
      // Browser
      const rawData = await storage.readFileAsync(this.filename, 'utf8')
      treatedData = this.treatRawData(rawData)
    }
    // Recreate all indexes in the datafile
    Object.keys(treatedData.indexes).forEach(key => {
      this.db.indexes[key] = new Index(treatedData.indexes[key])
    })

    // Fill cached database (i.e. all indexes) with data
    try {
      this.db.resetIndexes(treatedData.data)
    } catch (e) {
      this.db.resetIndexes() // Rollback any index which didn't fail
      throw e
    }

    await this.db.persistence.persistCachedDatabaseAsync()
    this.db.executor.processBuffer()
  }

  /**
   * @callback Persistence~ensureDirectoryExistsCallback
   * @param {Error?} err
   */

  /**
   * Check if a directory stat and create it on the fly if it is not the case
   * @param {string} dir
   * @param {Persistence~ensureDirectoryExistsCallback} [callback = () => {}] optional callback, signature: err
   */
  static ensureDirectoryExists (dir, callback = () => {}) {
    storage.mkdir(dir, { recursive: true }, err => { callback(err) })
  }

  /**
   * Check if a directory stat and create it on the fly if it is not the case
   * @param {string} dir
   * @return {Promise<void>}
   */
  static async ensureDirectoryExistsAsync (dir) {
    await storage.mkdirAsync(dir, { recursive: true })
  }

  /**
   * Return the path the datafile if the given filename is relative to the directory where Node Webkit stores
   * data for this application. Probably the best place to store data
   * @param {string} appName
   * @param {string} relativeFilename
   * @return {string}
   * @deprecated
   */
  static getNWAppFilename (appName, relativeFilename) {
    return deprecate(() => {
      let home

      if (process.platform === 'win32' || process.platform === 'win64') {
        home = process.env.LOCALAPPDATA || process.env.APPDATA
        if (!home) throw new Error('Couldn\'t find the base application data folder')
        home = path.join(home, appName)
      } else if (process.platform === 'darwin') {
        home = process.env.HOME
        if (!home) throw new Error('Couldn\'t find the base application data directory')
        home = path.join(home, 'Library', 'Application Support', appName)
      } else if (process.platform === 'linux') {
        home = process.env.HOME
        if (!home) throw new Error('Couldn\'t find the base application data directory')
        home = path.join(home, '.config', appName)
      } else throw new Error(`Can't use the Node Webkit relative path for platform ${process.platform}`)

      return path.join(home, 'nedb-data', relativeFilename)
    }, 'The getNWAppFilename static method is deprecated and will be removed in the next version. To get the path to the directory where Node Webkit stores the data for your app, use the internal nw.gui module like this require(\'nw.gui\').App.dataPath See https://github.com/rogerwang/node-webkit/issues/500')()
  }
}

// Interface
module.exports = Persistence
