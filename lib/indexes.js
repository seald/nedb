const BinarySearchTree = require('@seald-io/binary-search-tree').AVLTree
const model = require('./model.js')
const { uniq, isDate } = require('./utils.js')

/**
 * Two indexed pointers are equal iif they point to the same place
 */
const checkValueEquality = (a, b) => a === b

/**
 * Type-aware projection
 */
function projectForUnique (elt) {
  if (elt === null) return '$null'
  if (typeof elt === 'string') return '$string' + elt
  if (typeof elt === 'boolean') return '$boolean' + elt
  if (typeof elt === 'number') return '$number' + elt
  if (isDate(elt)) return '$date' + elt.getTime()

  return elt // Arrays and objects, will check for pointer equality
}

class Index {
  /**
   * Create a new index
   * All methods on an index guarantee that either the whole operation was successful and the index changed
   * or the operation was unsuccessful and an error is thrown while the index is unchanged
   * @param {String} options.fieldName On which field should the index apply (can use dot notation to index on sub fields)
   * @param {Boolean} options.unique Optional, enforce a unique constraint (default: false)
   * @param {Boolean} options.sparse Optional, allow a sparse index (we can have documents for which fieldName is undefined) (default: false)
   */
  constructor (options) {
    this.fieldName = options.fieldName
    this.unique = options.unique || false
    this.sparse = options.sparse || false

    this.treeOptions = { unique: this.unique, compareKeys: model.compareThings, checkValueEquality: checkValueEquality }

    this.reset() // No data in the beginning
  }

  /**
   * Reset an index
   * @param {Document or Array of documents} newData Optional, data to initialize the index with
   *                                                 If an error is thrown during insertion, the index is not modified
   */
  reset (newData) {
    this.tree = new BinarySearchTree(this.treeOptions)

    if (newData) this.insert(newData)
  }

  /**
   * Insert a new document in the index
   * If an array is passed, we insert all its elements (if one insertion fails the index is not modified)
   * O(log(n))
   */
  insert (doc) {
    let keys
    let failingIndex
    let error

    if (Array.isArray(doc)) {
      this.insertMultipleDocs(doc)
      return
    }

    const key = model.getDotValue(doc, this.fieldName)

    // We don't index documents that don't contain the field if the index is sparse
    if (key === undefined && this.sparse) return

    if (!Array.isArray(key)) this.tree.insert(key, doc)
    else {
      // If an insert fails due to a unique constraint, roll back all inserts before it
      keys = uniq(key, projectForUnique)

      for (let i = 0; i < keys.length; i += 1) {
        try {
          this.tree.insert(keys[i], doc)
        } catch (e) {
          error = e
          failingIndex = i
          break
        }
      }

      if (error) {
        for (let i = 0; i < failingIndex; i += 1) {
          this.tree.delete(keys[i], doc)
        }

        throw error
      }
    }
  }

  /**
   * Insert an array of documents in the index
   * If a constraint is violated, the changes should be rolled back and an error thrown
   *
   * @API private
   */
  insertMultipleDocs (docs) {
    let error
    let failingIndex

    for (let i = 0; i < docs.length; i += 1) {
      try {
        this.insert(docs[i])
      } catch (e) {
        error = e
        failingIndex = i
        break
      }
    }

    if (error) {
      for (let i = 0; i < failingIndex; i += 1) {
        this.remove(docs[i])
      }

      throw error
    }
  }

  /**
   * Remove a document from the index
   * If an array is passed, we remove all its elements
   * The remove operation is safe with regards to the 'unique' constraint
   * O(log(n))
   */
  remove (doc) {
    if (Array.isArray(doc)) {
      doc.forEach(d => { this.remove(d) })
      return
    }

    const key = model.getDotValue(doc, this.fieldName)

    if (key === undefined && this.sparse) return

    if (!Array.isArray(key)) {
      this.tree.delete(key, doc)
    } else {
      uniq(key, projectForUnique).forEach(_key => {
        this.tree.delete(_key, doc)
      })
    }
  }

  /**
   * Update a document in the index
   * If a constraint is violated, changes are rolled back and an error thrown
   * Naive implementation, still in O(log(n))
   */
  update (oldDoc, newDoc) {
    if (Array.isArray(oldDoc)) {
      this.updateMultipleDocs(oldDoc)
      return
    }

    this.remove(oldDoc)

    try {
      this.insert(newDoc)
    } catch (e) {
      this.insert(oldDoc)
      throw e
    }
  }

  /**
   * Update multiple documents in the index
   * If a constraint is violated, the changes need to be rolled back
   * and an error thrown
   * @param {Array<{ oldDoc: T, newDoc: T }>} pairs
   *
   * @private
   */
  updateMultipleDocs (pairs) {
    let failingIndex
    let error

    for (let i = 0; i < pairs.length; i += 1) {
      this.remove(pairs[i].oldDoc)
    }

    for (let i = 0; i < pairs.length; i += 1) {
      try {
        this.insert(pairs[i].newDoc)
      } catch (e) {
        error = e
        failingIndex = i
        break
      }
    }

    // If an error was raised, roll back changes in the inverse order
    if (error) {
      for (let i = 0; i < failingIndex; i += 1) {
        this.remove(pairs[i].newDoc)
      }

      for (let i = 0; i < pairs.length; i += 1) {
        this.insert(pairs[i].oldDoc)
      }

      throw error
    }
  }

  /**
   * Revert an update
   */
  revertUpdate (oldDoc, newDoc) {
    const revert = []

    if (!Array.isArray(oldDoc)) this.update(newDoc, oldDoc)
    else {
      oldDoc.forEach(pair => {
        revert.push({ oldDoc: pair.newDoc, newDoc: pair.oldDoc })
      })
      this.update(revert)
    }
  }

  /**
   * Get all documents in index whose key match value (if it is a Thing) or one of the elements of value (if it is an array of Things)
   * @param {Thing} value Value to match the key against
   * @return {Array of documents}
   */
  getMatching (value) {
    if (!Array.isArray(value)) return this.tree.search(value)
    else {
      const _res = {}
      const res = []

      value.forEach(v => {
        this.getMatching(v).forEach(doc => {
          _res[doc._id] = doc
        })
      })

      Object.keys(_res).forEach(_id => {
        res.push(_res[_id])
      })

      return res
    }
  }

  /**
   * Get all documents in index whose key is between bounds are they are defined by query
   * Documents are sorted by key
   * @param {Query} query
   * @return {Array of documents}
   */
  getBetweenBounds (query) {
    return this.tree.betweenBounds(query)
  }

  /**
   * Get all elements in the index
   * @return {Array of documents}
   */
  getAll () {
    const res = []

    this.tree.executeOnEveryNode(node => {
      res.push(...node.data)
    })

    return res
  }
}

// Interface
module.exports = Index
