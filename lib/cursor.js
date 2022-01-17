const model = require('./model.js')
const { callbackify } = require('util')

/**
 * Has a callback
 * @callback Cursor~mapFn
 * @param {document[]} res
 * @return {*|Promise<*>}
 */

/**
 * Manage access to data, be it to find, update or remove it.
 *
 * It extends `Promise` so that its methods (which return `this`) are chainable & awaitable.
 * @extends Promise
 */
class Cursor {
  /**
   * Create a new cursor for this collection.
   * @param {Datastore} db - The datastore this cursor is bound to
   * @param {query} query - The query this cursor will operate on
   * @param {Cursor~mapFn} [mapFn] - Handler to be executed after cursor has found the results and before the callback passed to find/findOne/update/remove
   */
  constructor (db, query, mapFn) {
    /**
     * @protected
     * @type {Datastore}
     */
    this.db = db
    /**
     * @protected
     * @type {query}
     */
    this.query = query || {}
    /**
     * The handler to be executed after cursor has found the results.
     * @type {Cursor~mapFn}
     * @protected
     */
    if (mapFn) this.mapFn = mapFn
    /**
     * @see Cursor#limit
     * @type {undefined|number}
     * @private
     */
    this._limit = undefined
    /**
     * @see Cursor#skip
     * @type {undefined|number}
     * @private
     */
    this._skip = undefined
    /**
     * @see Cursor#sort
     * @type {undefined|Object.<string, number>}
     * @private
     */
    this._sort = undefined
    /**
     * @see Cursor#projection
     * @type {undefined|Object.<string, number>}
     * @private
     */
    this._projection = undefined
  }

  /**
   * Set a limit to the number of results for the given Cursor.
   * @param {Number} limit
   * @return {Cursor} the same instance of Cursor, (useful for chaining).
   */
  limit (limit) {
    this._limit = limit
    return this
  }

  /**
   * Skip a number of results for the given Cursor.
   * @param {Number} skip
   * @return {Cursor} the same instance of Cursor, (useful for chaining).
   */
  skip (skip) {
    this._skip = skip
    return this
  }

  /**
   * Sort results of the query for the given Cursor.
   * @param {Object.<string, number>} sortQuery - sortQuery is { field: order }, field can use the dot-notation, order is 1 for ascending and -1 for descending
   * @return {Cursor} the same instance of Cursor, (useful for chaining).
   */
  sort (sortQuery) {
    this._sort = sortQuery
    return this
  }

  /**
   * Add the use of a projection to the given Cursor.
   * @param {Object.<string, number>} projection - MongoDB-style projection. {} means take all fields. Then it's { key1: 1, key2: 1 } to take only key1 and key2
   * { key1: 0, key2: 0 } to omit only key1 and key2. Except _id, you can't mix takes and omits.
   * @return {Cursor} the same instance of Cursor, (useful for chaining).
   */
  projection (projection) {
    this._projection = projection
    return this
  }

  /**
   * Apply the projection.
   *
   * This is an internal function. You should use {@link Cursor#execAsync} or {@link Cursor#exec}.
   * @param {document[]} candidates
   * @return {document[]}
   * @private
   */
  _project (candidates) {
    const res = []
    let action

    if (this._projection === undefined || Object.keys(this._projection).length === 0) {
      return candidates
    }

    const keepId = this._projection._id !== 0
    const { _id, ...rest } = this._projection
    this._projection = rest

    // Check for consistency
    const keys = Object.keys(this._projection)
    keys.forEach(k => {
      if (action !== undefined && this._projection[k] !== action) throw new Error('Can\'t both keep and omit fields except for _id')
      action = this._projection[k]
    })

    // Do the actual projection
    candidates.forEach(candidate => {
      let toPush
      if (action === 1) { // pick-type projection
        toPush = { $set: {} }
        keys.forEach(k => {
          toPush.$set[k] = model.getDotValue(candidate, k)
          if (toPush.$set[k] === undefined) delete toPush.$set[k]
        })
        toPush = model.modify({}, toPush)
      } else { // omit-type projection
        toPush = { $unset: {} }
        keys.forEach(k => { toPush.$unset[k] = true })
        toPush = model.modify(candidate, toPush)
      }
      if (keepId) toPush._id = candidate._id
      else delete toPush._id
      res.push(toPush)
    })

    return res
  }

  /**
   * Get all matching elements
   * Will return pointers to matched elements (shallow copies), returning full copies is the role of find or findOne
   * This is an internal function, use execAsync which uses the executor
   * @return {document[]|Promise<*>}
   * @private
   */
  async _execAsync () {
    let res = []
    let added = 0
    let skipped = 0

    const candidates = await this.db._getCandidatesAsync(this.query)

    for (const candidate of candidates) {
      if (model.match(candidate, this.query)) {
        // If a sort is defined, wait for the results to be sorted before applying limit and skip
        if (!this._sort) {
          if (this._skip && this._skip > skipped) skipped += 1
          else {
            res.push(candidate)
            added += 1
            if (this._limit && this._limit <= added) break
          }
        } else res.push(candidate)
      }
    }

    // Apply all sorts
    if (this._sort) {
      // Sorting
      const criteria = Object.entries(this._sort).map(([key, direction]) => ({ key, direction }))
      res.sort((a, b) => {
        for (const criterion of criteria) {
          const compare = criterion.direction * model.compareThings(model.getDotValue(a, criterion.key), model.getDotValue(b, criterion.key), this.db.compareStrings)
          if (compare !== 0) return compare
        }
        return 0
      })

      // Applying limit and skip
      const limit = this._limit || res.length
      const skip = this._skip || 0

      res = res.slice(skip, skip + limit)
    }

    // Apply projection
    res = this._project(res)
    if (this.mapFn) return this.mapFn(res)
    return res
  }

  /**
   * @callback Cursor~execCallback
   * @param {Error} err
   * @param {document[]|*} res If a mapFn was given to the Cursor, then the type of this parameter is the one returned by the mapFn.
   */

  /**
   * Callback version of {@link Cursor#exec}.
   * @param {Cursor~execCallback} _callback
   * @see Cursor#execAsync
   */
  exec (_callback) {
    callbackify(() => this.execAsync())(_callback)
  }

  /**
   * Get all matching elements.
   * Will return pointers to matched elements (shallow copies), returning full copies is the role of {@link Datastore#findAsync} or {@link Datastore#findOneAsync}.
   * @return {Promise<document[]|*>}
   * @async
   */
  execAsync () {
    return this.db.executor.pushAsync(() => this._execAsync())
  }

  then (onFulfilled, onRejected) {
    return this.execAsync().then(onFulfilled, onRejected)
  }

  catch (onRejected) {
    return this.execAsync().catch(onRejected)
  }

  finally (onFinally) {
    return this.execAsync().finally(onFinally)
  }
}

// Interface
module.exports = Cursor
