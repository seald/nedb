/**
 * Manage access to data, be it to find, update or remove it
 */
const model = require('./model.js')

class Cursor {
  /**
   * Create a new cursor for this collection
   * @param {Datastore} db - The datastore this cursor is bound to
   * @param {Query} query - The query this cursor will operate on
   * @param {Function} execFn - Handler to be executed after cursor has found the results and before the callback passed to find/findOne/update/remove
   */
  constructor (db, query, execFn) {
    this.db = db
    this.query = query || {}
    if (execFn) { this.execFn = execFn }
  }

  /**
   * Set a limit to the number of results
   */
  limit (limit) {
    this._limit = limit
    return this
  }

  /**
   * Skip a the number of results
   */
  skip (skip) {
    this._skip = skip
    return this
  }

  /**
   * Sort results of the query
   * @param {SortQuery} sortQuery - SortQuery is { field: order }, field can use the dot-notation, order is 1 for ascending and -1 for descending
   */
  sort (sortQuery) {
    this._sort = sortQuery
    return this
  }

  /**
   * Add the use of a projection
   * @param {Object} projection - MongoDB-style projection. {} means take all fields. Then it's { key1: 1, key2: 1 } to take only key1 and key2
   *                              { key1: 0, key2: 0 } to omit only key1 and key2. Except _id, you can't mix takes and omits
   */
  projection (projection) {
    this._projection = projection
    return this
  }

  /**
   * Apply the projection
   */
  project (candidates) {
    const res = []
    const self = this
    let action

    if (this._projection === undefined || Object.keys(this._projection).length === 0) {
      return candidates
    }

    const keepId = this._projection._id !== 0
    const { _id, ...rest } = this._projection
    this._projection = rest

    // Check for consistency
    const keys = Object.keys(this._projection)
    keys.forEach(function (k) {
      if (action !== undefined && self._projection[k] !== action) { throw new Error('Can\'t both keep and omit fields except for _id') }
      action = self._projection[k]
    })

    // Do the actual projection
    candidates.forEach(function (candidate) {
      let toPush
      if (action === 1) { // pick-type projection
        toPush = { $set: {} }
        keys.forEach(function (k) {
          toPush.$set[k] = model.getDotValue(candidate, k)
          if (toPush.$set[k] === undefined) { delete toPush.$set[k] }
        })
        toPush = model.modify({}, toPush)
      } else { // omit-type projection
        toPush = { $unset: {} }
        keys.forEach(function (k) { toPush.$unset[k] = true })
        toPush = model.modify(candidate, toPush)
      }
      if (keepId) {
        toPush._id = candidate._id
      } else {
        delete toPush._id
      }
      res.push(toPush)
    })

    return res
  }

  /**
   * Get all matching elements
   * Will return pointers to matched elements (shallow copies), returning full copies is the role of find or findOne
   * This is an internal function, use exec which uses the executor
   *
   * @param {Function} callback - Signature: err, results
   */
  _exec (_callback) {
    let res = []
    let added = 0
    let skipped = 0
    const self = this
    let error = null
    let i
    let keys
    let key

    function callback (error, res) {
      if (self.execFn) {
        return self.execFn(error, res, _callback)
      } else {
        return _callback(error, res)
      }
    }

    this.db.getCandidates(this.query, function (err, candidates) {
      if (err) { return callback(err) }

      try {
        for (i = 0; i < candidates.length; i += 1) {
          if (model.match(candidates[i], self.query)) {
            // If a sort is defined, wait for the results to be sorted before applying limit and skip
            if (!self._sort) {
              if (self._skip && self._skip > skipped) {
                skipped += 1
              } else {
                res.push(candidates[i])
                added += 1
                if (self._limit && self._limit <= added) { break }
              }
            } else {
              res.push(candidates[i])
            }
          }
        }
      } catch (err) {
        return callback(err)
      }

      // Apply all sorts
      if (self._sort) {
        keys = Object.keys(self._sort)

        // Sorting
        const criteria = []
        for (i = 0; i < keys.length; i++) {
          key = keys[i]
          criteria.push({ key: key, direction: self._sort[key] })
        }
        res.sort(function (a, b) {
          let criterion
          let compare
          let i
          for (i = 0; i < criteria.length; i++) {
            criterion = criteria[i]
            compare = criterion.direction * model.compareThings(model.getDotValue(a, criterion.key), model.getDotValue(b, criterion.key), self.db.compareStrings)
            if (compare !== 0) {
              return compare
            }
          }
          return 0
        })

        // Applying limit and skip
        const limit = self._limit || res.length
        const skip = self._skip || 0

        res = res.slice(skip, skip + limit)
      }

      // Apply projection
      try {
        res = self.project(res)
      } catch (e) {
        error = e
        res = undefined
      }

      return callback(error, res)
    })
  }

  exec () {
    this.db.executor.push({ this: this, fn: this._exec, arguments: arguments })
  }
}

// Interface
module.exports = Cursor
