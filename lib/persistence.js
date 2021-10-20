/**
 * Handle every persistence-related task
 * The interface Datastore expects to be implemented is
 * * Persistence.loadDatabase(callback) and callback has signature err
 * * Persistence.persistNewState(newDocs, callback) where newDocs is an array of documents and callback has signature err
 */
const path = require('path')
const async = require('async')
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
      console.log('==================================================================')
      console.log('WARNING: The nodeWebkitAppName option is deprecated')
      console.log('To get the path to the directory where Node Webkit stores the data')
      console.log('for your app, use the internal nw.gui module like this')
      console.log('require(\'nw.gui\').App.dataPath')
      console.log('See https://github.com/rogerwang/node-webkit/issues/500')
      console.log('==================================================================')
      this.filename = Persistence.getNWAppFilename(options.nodeWebkitAppName, this.filename)
    }
  }

  /**
   * Persist cached database
   * This serves as a compaction function since the cache always contains only the number of documents in the collection
   * while the data file is append-only so it may grow larger
   * @param {Function} callback Optional callback, signature: err
   */
  persistCachedDatabase (callback = () => {}) {
    const lines = []

    if (this.inMemoryOnly) return callback(null)

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

    storage.crashSafeWriteFileLines(this.filename, lines, err => {
      if (err) return callback(err)
      this.db.emit('compaction.done')
      return callback(null)
    })
  }

  /**
   * Queue a rewrite of the datafile
   */
  compactDatafile () {
    this.db.executor.push({ this: this, fn: this.persistCachedDatabase, arguments: [] })
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
   * Persist new state for the given newDocs (can be insertion, update or removal)
   * Use an append-only format
   * @param {Array} newDocs Can be empty if no doc was updated/removed
   * @param {Function} callback Optional, signature: err
   */
  persistNewState (newDocs, callback = () => {}) {
    let toPersist = ''

    // In-memory only datastore
    if (this.inMemoryOnly) return callback(null)

    newDocs.forEach(doc => {
      toPersist += this.afterSerialization(model.serialize(doc)) + '\n'
    })

    if (toPersist.length === 0) return callback(null)

    storage.appendFile(this.filename, toPersist, 'utf8', err => callback(err))
  }

  /**
   * From a database's raw data, return the corresponding
   * machine understandable collection
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
   * From a database's raw stream, return the corresponding
   * machine understandable collection
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
   * Load the database
   * 1) Create all indexes
   * 2) Insert all data
   * 3) Compact the database
   * This means pulling data out of the data file or creating it if it doesn't exist
   * Also, all data is persisted right away, which has the effect of compacting the database file
   * This operation is very quick at startup for a big collection (60ms for ~10k docs)
   * @param {Function} callback Optional callback, signature: err
   */
  loadDatabase (callback = () => {}) {
    this.db.resetIndexes()

    // In-memory only datastore
    if (this.inMemoryOnly) return callback(null)

    async.waterfall([
      cb => {
        // eslint-disable-next-line node/handle-callback-err
        Persistence.ensureDirectoryExists(path.dirname(this.filename), err => {
          // TODO: handle error
          // eslint-disable-next-line node/handle-callback-err
          storage.ensureDatafileIntegrity(this.filename, err => {
            // TODO: handle error
            const treatedDataCallback = (err, treatedData) => {
              if (err) return cb(err)

              // Recreate all indexes in the datafile
              Object.keys(treatedData.indexes).forEach(key => {
                this.db.indexes[key] = new Index(treatedData.indexes[key])
              })

              // Fill cached database (i.e. all indexes) with data
              try {
                this.db.resetIndexes(treatedData.data)
              } catch (e) {
                this.db.resetIndexes() // Rollback any index which didn't fail
                return cb(e)
              }

              this.db.persistence.persistCachedDatabase(cb)
            }

            if (storage.readFileStream) {
              // Server side
              const fileStream = storage.readFileStream(this.filename, { encoding: 'utf8' })
              this.treatRawStream(fileStream, treatedDataCallback)
              return
            }

            // Browser
            storage.readFile(this.filename, 'utf8', (err, rawData) => {
              if (err) return cb(err)

              try {
                const treatedData = this.treatRawData(rawData)
                treatedDataCallback(null, treatedData)
              } catch (e) {
                return cb(e)
              }
            })
          })
        })
      }
    ], err => {
      if (err) return callback(err)

      this.db.executor.processBuffer()
      return callback(null)
    })
  }

  /**
   * Check if a directory stat and create it on the fly if it is not the case
   * cb is optional, signature: err
   */
  static ensureDirectoryExists (dir, callback = () => {}) {
    storage.mkdir(dir, { recursive: true }, err => { callback(err) })
  }

  /**
   * Return the path the datafile if the given filename is relative to the directory where Node Webkit stores
   * data for this application. Probably the best place to store data
   */
  static getNWAppFilename (appName, relativeFilename) {
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
  }
}

// Interface
module.exports = Persistence
