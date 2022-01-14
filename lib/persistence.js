const path = require('path')
const { callbackify } = require('util')
const byline = require('./byline')
const customUtils = require('./customUtils.js')
const Index = require('./indexes.js')
const model = require('./model.js')
const storage = require('./storage.js')

/**
 * Under the hood, NeDB's persistence uses an append-only format, meaning that all
 * updates and deletes actually result in lines added at the end of the datafile,
 * for performance reasons. The database is automatically compacted (i.e. put back
 * in the one-line-per-document format) every time you load each database within
 * your application.
 *
 * You can manually call the compaction function
 * with `yourDatabase.persistence.compactDatafile` which takes no argument. It
 * queues a compaction of the datafile in the executor, to be executed sequentially
 * after all pending operations. The datastore will fire a `compaction.done` event
 * once compaction is finished.
 *
 * You can also set automatic compaction at regular intervals
 * with `yourDatabase.persistence.setAutocompactionInterval(interval)`, `interval`
 * in milliseconds (a minimum of 5s is enforced), and stop automatic compaction
 * with `yourDatabase.persistence.stopAutocompaction()`.
 *
 * Keep in mind that compaction takes a bit of time (not too much: 130ms for 50k
 * records on a typical development machine) and no other operation can happen when
 * it does, so most projects actually don't need to use it.
 *
 * Compaction will also immediately remove any documents whose data line has become
 * corrupted, assuming that the total percentage of all corrupted documents in that
 * database still falls below the specified `corruptAlertThreshold` option's value.
 *
 * Durability works similarly to major databases: compaction forces the OS to
 * physically flush data to disk, while appends to the data file do not (the OS is
 * responsible for flushing the data). That guarantees that a server crash can
 * never cause complete data loss, while preserving performance. The worst that can
 * happen is a crash between two syncs, causing a loss of all data between the two
 * syncs. Usually syncs are 30 seconds appart so that's at most 30 seconds of
 * data. [This post by Antirez on Redis persistence](http://oldblog.antirez.com/post/redis-persistence-demystified.html)
 * explains this in more details, NeDB being very close to Redis AOF persistence
 * with `appendfsync` option set to `no`.
 */
class Persistence {
  /**
   * Create a new Persistence object for database options.db
   * @param {Datastore} options.db
   * @param {Number} [options.corruptAlertThreshold] Optional, threshold after which an alert is thrown if too much data is corrupt
   * @param {serializationHook} [options.beforeDeserialization] Hook you can use to transform data after it was serialized and before it is written to disk.
   * @param {serializationHook} [options.afterSerialization] Inverse of `afterSerialization`.
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
  }

  /**
   * Persist cached database
   * This serves as a compaction function since the cache always contains only the number of documents in the collection
   * while the data file is append-only so it may grow larger
   *
   * This is an internal function, use {@link Persistence#compactDatafileAsync} which uses the [executor]{@link Datastore#executor}.
   * @return {Promise<void>}
   * @protected
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
   * Queue a rewrite of the datafile
   * @param {NoParamCallback} [callback = () => {}]
   * @see Persistence#persistCachedDatabaseAsync
   */
  compactDatafile (callback) {
    if (typeof callback !== 'function') callback = () => {}
    callbackify(() => this.compactDatafileAsync())(callback)
  }

  /**
   * Async version of {@link Persistence#compactDatafile}.
   * @async
   * @see Persistence#compactDatafile
   */
  compactDatafileAsync () {
    return this.db.executor.pushAsync(() => this.persistCachedDatabaseAsync())
  }

  /**
   * Set automatic compaction every `interval` ms
   * @param {Number} interval in milliseconds, with an enforced minimum of 5000 milliseconds
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
   * Stop autocompaction (do nothing if automatic compaction was not running)
   */
  stopAutocompaction () {
    if (this.autocompactionIntervalId) clearInterval(this.autocompactionIntervalId)
  }

  /**
   * Persist new state for the given newDocs (can be insertion, update or removal)
   * Use an append-only format
   *
   * Do not use directly, it should only used by a {@link Datastore} instance.
   * @param {document[]} newDocs Can be empty if no doc was updated/removed
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
   * From a database's raw data, return the corresponding machine understandable collection.
   *
   * Do not use directly, it should only used by a {@link Datastore} instance.
   * @param {string} rawData database file
   * @return {{data: document[], indexes: Object.<string, rawIndex>}}
   * @protected
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
   * From a database's raw data stream, return the corresponding machine understandable collection
   * Is only used by a {@link Datastore} instance.
   *
   * Is only used in the Node.js version, since [React-Native]{@link module:storageReactNative} &
   * [browser]{@link module:storageBrowser} storage modules don't provide an equivalent of
   * {@link module:storage.readFileStream}.
   *
   * Do not use directly, it should only used by a {@link Datastore} instance.
   * @param {Readable} rawStream
   * @return {Promise<{data: document[], indexes: Object.<string, rawIndex>}>}
   * @async
   * @protected
   */
  treatRawStreamAsync (rawStream) {
    return new Promise((resolve, reject) => {
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
          reject(err, null)
          return
        }

        const data = Object.values(dataById)

        resolve({ data, indexes: indexes })
      })

      lineStream.on('error', function (err) {
        reject(err, null)
      })
    })
  }

  /**
   * Load the database
   * 1) Create all indexes
   * 2) Insert all data
   * 3) Compact the database
   *
   * This means pulling data out of the data file or creating it if it doesn't exist
   * Also, all data is persisted right away, which has the effect of compacting the database file
   * This operation is very quick at startup for a big collection (60ms for ~10k docs)
   *
   * Do not use directly as it does not use the [Executor]{@link Datastore.executor}, use {@link Datastore#loadDatabase} instead.
   * @param {NoParamCallback} callback
   * @protected
   */
  loadDatabase (callback = () => {}) {
    callbackify(this.loadDatabaseAsync.bind(this))(err => callback(err))
  }

  /**
   * Async version of {@link Persistence#loadDatabase}
   * @return {Promise<void>}
   * @see Persistence#loadDatabase
   */
  async loadDatabaseAsync () {
    this.db._resetIndexes()

    // In-memory only datastore
    if (this.inMemoryOnly) return
    await Persistence.ensureDirectoryExistsAsync(path.dirname(this.filename))
    await storage.ensureDatafileIntegrityAsync(this.filename)

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
      this.db._resetIndexes(treatedData.data)
    } catch (e) {
      this.db._resetIndexes() // Rollback any index which didn't fail
      throw e
    }

    await this.db.persistence.persistCachedDatabaseAsync()
    this.db.executor.processBuffer()
  }

  async dropDatabaseAsync () {
    this.stopAutocompaction() // stop autocompaction
    this.db.executor.ready = false // prevent queuing new tasks
    this.db.executor.resetBuffer() // remove pending buffered tasks
    await this.db.executor.queue.guardian // wait for the ongoing tasks to end
    // remove indexes (which means remove data from memory)
    this.db.indexes = {}
    // add back _id index, otherwise it will fail
    this.db.indexes._id = new Index({ fieldName: '_id', unique: true })
    // reset TTL on indexes
    this.db.ttlIndexes = {}

    // remove datastore file
    await this.db.executor(() => storage.unlinkAsync(this.filename), true)
  }

  /**
   * Check if a directory stat and create it on the fly if it is not the case.
   * @param {string} dir
   * @return {Promise<void>}
   */
  static async ensureDirectoryExistsAsync (dir) {
    await storage.mkdirAsync(dir, { recursive: true })
  }
}

// Interface
module.exports = Persistence
