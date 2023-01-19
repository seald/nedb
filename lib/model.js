/**
 * Handle models (i.e. docs)
 * Serialization/deserialization
 * Copying
 * Querying, update
 * @module model
 * @private
 */
const { uniq, isDate, isRegExp } = require('./utils.js')

/**
 * Check a key, throw an error if the key is non valid
 * @param {string} k key
 * @param {document} v value, needed to treat the Date edge case
 * Non-treatable edge cases here: if part of the object if of the form { $$date: number } or { $$deleted: true }
 * Its serialized-then-deserialized version it will transformed into a Date object
 * But you really need to want it to trigger such behaviour, even when warned not to use '$' at the beginning of the field names...
 * @private
 */
const checkKey = (k, v) => {
  if (typeof k === 'number') k = k.toString()

  if (
    k[0] === '$' &&
    !(k === '$$date' && typeof v === 'number') &&
    !(k === '$$deleted' && v === true) &&
    !(k === '$$indexCreated') &&
    !(k === '$$indexRemoved')
  ) throw new Error('Field names cannot begin with the $ character')

  if (k.indexOf('.') !== -1) throw new Error('Field names cannot contain a .')
}

/**
 * Check a DB object and throw an error if it's not valid
 * Works by applying the above checkKey function to all fields recursively
 * @param {document|document[]} obj
 * @alias module:model.checkObject
 */
const checkObject = obj => {
  if (Array.isArray(obj)) {
    obj.forEach(o => {
      checkObject(o)
    })
  }

  if (typeof obj === 'object' && obj !== null) {
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        checkKey(k, obj[k])
        checkObject(obj[k])
      }
    }
  }
}

/**
 * Serialize an object to be persisted to a one-line string
 * For serialization/deserialization, we use the native JSON parser and not eval or Function
 * That gives us less freedom but data entered in the database may come from users
 * so eval and the like are not safe
 * Accepted primitive types: Number, String, Boolean, Date, null
 * Accepted secondary types: Objects, Arrays
 * @param {document} obj
 * @return {string}
 * @alias module:model.serialize
 */
const serialize = obj => {
  return JSON.stringify(obj, function (k, v) {
    checkKey(k, v)

    if (v === undefined) return undefined
    if (v === null) return null

    // Hackish way of checking if object is Date (this way it works between execution contexts in node-webkit).
    // We can't use value directly because for dates it is already string in this function (date.toJSON was already called), so we use this
    if (typeof this[k].getTime === 'function') return { $$date: this[k].getTime() }

    return v
  })
}

/**
 * From a one-line representation of an object generate by the serialize function
 * Return the object itself
 * @param {string} rawData
 * @return {document}
 * @alias module:model.deserialize
 */
const deserialize = rawData => JSON.parse(rawData, function (k, v) {
  if (k === '$$date') return new Date(v)
  if (
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    v === null
  ) return v
  if (v && v.$$date) return v.$$date

  return v
})

/**
 * Deep copy a DB object
 * The optional strictKeys flag (defaulting to false) indicates whether to copy everything or only fields
 * where the keys are valid, i.e. don't begin with $ and don't contain a .
 * @param {?document} obj
 * @param {boolean} [strictKeys=false]
 * @return {?document}
 * @alias module:modelel:(.*)
 */
function deepCopy (obj, strictKeys) {
  if (
    typeof obj === 'boolean' ||
    typeof obj === 'number' ||
    typeof obj === 'string' ||
    obj === null ||
    (isDate(obj))
  ) return obj

  if (Array.isArray(obj)) return obj.map(o => deepCopy(o, strictKeys))

  if (typeof obj === 'object') {
    const res = {}
    for (const k in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, k) &&
        (!strictKeys || (k[0] !== '$' && k.indexOf('.') === -1))
      ) {
        res[k] = deepCopy(obj[k], strictKeys)
      }
    }
    return res
  }

  return undefined // For now everything else is undefined. We should probably throw an error instead
}

/**
 * Tells if an object is a primitive type or a "real" object
 * Arrays are considered primitive
 * @param {*} obj
 * @return {boolean}
 * @alias module:modelel:(.*)
 */
const isPrimitiveType = obj => (
  typeof obj === 'boolean' ||
  typeof obj === 'number' ||
  typeof obj === 'string' ||
  obj === null ||
  isDate(obj) ||
  Array.isArray(obj)
)

/**
 * Utility functions for comparing things
 * Assumes type checking was already done (a and b already have the same type)
 * compareNSB works for numbers, strings and booleans
 * @param {number|string|boolean} a
 * @param {number|string|boolean} b
 * @return {number} 0 if a == b, 1 i a > b, -1 if a < b
 * @private
 */
const compareNSB = (a, b) => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Utility function for comparing array
 * Assumes type checking was already done (a and b already have the same type)
 * compareNSB works for numbers, strings and booleans
 * @param {Array} a
 * @param {Array} b
 * @return {number} 0 if arrays have the same length and all elements equal one another. Else either 1 or -1.
 * @private
 */
const compareArrays = (a, b) => {
  const minLength = Math.min(a.length, b.length)
  for (let i = 0; i < minLength; i += 1) {
    const comp = compareThings(a[i], b[i])

    if (comp !== 0) return comp
  }

  // Common section was identical, longest one wins
  return compareNSB(a.length, b.length)
}

/**
 * Compare { things U undefined }
 * Things are defined as any native types (string, number, boolean, null, date) and objects
 * We need to compare with undefined as it will be used in indexes
 * In the case of objects and arrays, we deep-compare
 * If two objects dont have the same type, the (arbitrary) type hierarchy is: undefined, null, number, strings, boolean, dates, arrays, objects
 * Return -1 if a < b, 1 if a > b and 0 if a = b (note that equality here is NOT the same as defined in areThingsEqual!)
 * @param {*} a
 * @param {*} b
 * @param {compareStrings} [_compareStrings] String comparing function, returning -1, 0 or 1, overriding default string comparison (useful for languages with accented letters)
 * @return {number}
 * @alias module:model.compareThings
 */
const compareThings = (a, b, _compareStrings) => {
  const compareStrings = _compareStrings || compareNSB

  // undefined
  if (a === undefined) return b === undefined ? 0 : -1
  if (b === undefined) return 1 // no need to test if a === undefined

  // null
  if (a === null) return b === null ? 0 : -1
  if (b === null) return 1 // no need to test if a === null

  // Numbers
  if (typeof a === 'number') return typeof b === 'number' ? compareNSB(a, b) : -1
  if (typeof b === 'number') return typeof a === 'number' ? compareNSB(a, b) : 1

  // Strings
  if (typeof a === 'string') return typeof b === 'string' ? compareStrings(a, b) : -1
  if (typeof b === 'string') return typeof a === 'string' ? compareStrings(a, b) : 1

  // Booleans
  if (typeof a === 'boolean') return typeof b === 'boolean' ? compareNSB(a, b) : -1
  if (typeof b === 'boolean') return typeof a === 'boolean' ? compareNSB(a, b) : 1

  // Dates
  if (isDate(a)) return isDate(b) ? compareNSB(a.getTime(), b.getTime()) : -1
  if (isDate(b)) return isDate(a) ? compareNSB(a.getTime(), b.getTime()) : 1

  // Arrays (first element is most significant and so on)
  if (Array.isArray(a)) return Array.isArray(b) ? compareArrays(a, b) : -1
  if (Array.isArray(b)) return Array.isArray(a) ? compareArrays(a, b) : 1

  // Objects
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()

  for (let i = 0; i < Math.min(aKeys.length, bKeys.length); i += 1) {
    const comp = compareThings(a[aKeys[i]], b[bKeys[i]])

    if (comp !== 0) return comp
  }

  return compareNSB(aKeys.length, bKeys.length)
}

// ==============================================================
// Updating documents
// ==============================================================

/**
 * @callback modifierFunction
 * The signature of modifier functions is as follows
 * Their structure is always the same: recursively follow the dot notation while creating
 * the nested documents if needed, then apply the "last step modifier"
 * @param {Object} obj The model to modify
 * @param {String} field Can contain dots, in that case that means we will set a subfield recursively
 * @param {document} value
 */

/**
 * Create the complete modifier function
 * @param {modifierFunction} lastStepModifierFunction a lastStepModifierFunction
 * @param {boolean} [unset = false] Bad looking specific fix, needs to be generalized modifiers that behave like $unset are implemented
 * @return {modifierFunction}
 * @private
 */
const createModifierFunction = (lastStepModifierFunction, unset = false) => (obj, field, value) => {
  const func = (obj, field, value) => {
    const fieldParts = typeof field === 'string' ? field.split('.') : field

    if (fieldParts.length === 1) lastStepModifierFunction(obj, field, value)
    else {
      if (obj[fieldParts[0]] === undefined) {
        if (unset) return
        obj[fieldParts[0]] = {}
      }
      func(obj[fieldParts[0]], fieldParts.slice(1), value)
    }
  }
  return func(obj, field, value)
}

const $addToSetPartial = (obj, field, value) => {
  // Create the array if it doesn't exist
  if (!Object.prototype.hasOwnProperty.call(obj, field)) { obj[field] = [] }

  if (!Array.isArray(obj[field])) throw new Error('Can\'t $addToSet an element on non-array values')

  if (value !== null && typeof value === 'object' && value.$each) {
    if (Object.keys(value).length > 1) throw new Error('Can\'t use another field in conjunction with $each')
    if (!Array.isArray(value.$each)) throw new Error('$each requires an array value')

    value.$each.forEach(v => {
      $addToSetPartial(obj, field, v)
    })
  } else {
    let addToSet = true
    obj[field].forEach(v => {
      if (compareThings(v, value) === 0) addToSet = false
    })
    if (addToSet) obj[field].push(value)
  }
}

/**
 * @enum {modifierFunction}
 */
const modifierFunctions = {
  /**
   * Set a field to a new value
   */
  $set: createModifierFunction((obj, field, value) => {
    obj[field] = value
  }),
  /**
   * Unset a field
   */
  $unset: createModifierFunction((obj, field, value) => {
    delete obj[field]
  }, true),
  /**
   * Updates the value of the field, only if specified field is smaller than the current value of the field
   */
  $min: createModifierFunction((obj, field, value) => {
    if (typeof obj[field] === 'undefined') obj[field] = value
    else if (value < obj[field]) obj[field] = value
  }),
  /**
   * Updates the value of the field, only if specified field is greater than the current value of the field
   */
  $max: createModifierFunction((obj, field, value) => {
    if (typeof obj[field] === 'undefined') obj[field] = value
    else if (value > obj[field]) obj[field] = value
  }),
  /**
   * Increment a numeric field's value
   */
  $inc: createModifierFunction((obj, field, value) => {
    if (typeof value !== 'number') throw new Error(`${value} must be a number`)

    if (typeof obj[field] !== 'number') {
      if (!Object.prototype.hasOwnProperty.call(obj, field)) obj[field] = value
      else throw new Error('Don\'t use the $inc modifier on non-number fields')
    } else obj[field] += value
  }),
  /**
   * Removes all instances of a value from an existing array
   */
  $pull: createModifierFunction((obj, field, value) => {
    if (!Array.isArray(obj[field])) throw new Error('Can\'t $pull an element from non-array values')

    const arr = obj[field]
    for (let i = arr.length - 1; i >= 0; i -= 1) {
      if (match(arr[i], value)) arr.splice(i, 1)
    }
  }),
  /**
   * Remove the first or last element of an array
   */
  $pop: createModifierFunction((obj, field, value) => {
    if (!Array.isArray(obj[field])) throw new Error('Can\'t $pop an element from non-array values')
    if (typeof value !== 'number') throw new Error(`${value} isn't an integer, can't use it with $pop`)
    if (value === 0) return

    if (value > 0) obj[field] = obj[field].slice(0, obj[field].length - 1)
    else obj[field] = obj[field].slice(1)
  }),
  /**
   * Add an element to an array field only if it is not already in it
   * No modification if the element is already in the array
   * Note that it doesn't check whether the original array contains duplicates
   */
  $addToSet: createModifierFunction($addToSetPartial),
  /**
   * Push an element to the end of an array field
   * Optional modifier $each instead of value to push several values
   * Optional modifier $slice to slice the resulting array, see https://docs.mongodb.org/manual/reference/operator/update/slice/
   * Difference with MongoDB: if $slice is specified and not $each, we act as if value is an empty array
   */
  $push: createModifierFunction((obj, field, value) => {
    // Create the array if it doesn't exist
    if (!Object.prototype.hasOwnProperty.call(obj, field)) obj[field] = []

    if (!Array.isArray(obj[field])) throw new Error('Can\'t $push an element on non-array values')

    if (
      value !== null &&
      typeof value === 'object' &&
      value.$slice &&
      value.$each === undefined
    ) value.$each = []

    if (value !== null && typeof value === 'object' && value.$each) {
      if (
        Object.keys(value).length >= 3 ||
        (Object.keys(value).length === 2 && value.$slice === undefined)
      ) throw new Error('Can only use $slice in cunjunction with $each when $push to array')
      if (!Array.isArray(value.$each)) throw new Error('$each requires an array value')

      value.$each.forEach(v => {
        obj[field].push(v)
      })

      if (value.$slice === undefined || typeof value.$slice !== 'number') return

      if (value.$slice === 0) obj[field] = []
      else {
        let start
        let end
        const n = obj[field].length
        if (value.$slice < 0) {
          start = Math.max(0, n + value.$slice)
          end = n
        } else if (value.$slice > 0) {
          start = 0
          end = Math.min(n, value.$slice)
        }
        obj[field] = obj[field].slice(start, end)
      }
    } else {
      obj[field].push(value)
    }
  })

}

/**
 * Modify a DB object according to an update query
 * @param {document} obj
 * @param {query} updateQuery
 * @return {document}
 * @alias module:model.modify
 */
const modify = (obj, updateQuery) => {
  const keys = Object.keys(updateQuery)
  const firstChars = keys.map(item => item[0])
  const dollarFirstChars = firstChars.filter(c => c === '$')
  let newDoc
  let modifiers

  if (keys.indexOf('_id') !== -1 && updateQuery._id !== obj._id) throw new Error('You cannot change a document\'s _id')

  if (dollarFirstChars.length !== 0 && dollarFirstChars.length !== firstChars.length) throw new Error('You cannot mix modifiers and normal fields')

  if (dollarFirstChars.length === 0) {
    // Simply replace the object with the update query contents
    newDoc = deepCopy(updateQuery)
    newDoc._id = obj._id
  } else {
    // Apply modifiers
    modifiers = uniq(keys)
    newDoc = deepCopy(obj)
    modifiers.forEach(m => {
      if (!modifierFunctions[m]) throw new Error(`Unknown modifier ${m}`)

      // Can't rely on Object.keys throwing on non objects since ES6
      // Not 100% satisfying as non objects can be interpreted as objects but no false negatives so we can live with it
      if (typeof updateQuery[m] !== 'object') throw new Error(`Modifier ${m}'s argument must be an object`)

      const keys = Object.keys(updateQuery[m])
      keys.forEach(k => {
        modifierFunctions[m](newDoc, k, updateQuery[m][k])
      })
    })
  }

  // Check result is valid and return it
  checkObject(newDoc)

  if (obj._id !== newDoc._id) throw new Error('You can\'t change a document\'s _id')
  return newDoc
}

// ==============================================================
// Finding documents
// ==============================================================

/**
 * Get a value from object with dot notation
 * @param {object} obj
 * @param {string} field
 * @return {*}
 * @alias module:model.getDotValue
 */
const getDotValue = (obj, field) => {
  const fieldParts = typeof field === 'string' ? field.split('.') : field

  if (!obj) return undefined // field cannot be empty so that means we should return undefined so that nothing can match

  if (fieldParts.length === 0) return obj

  if (fieldParts.length === 1) return obj[fieldParts[0]]

  if (Array.isArray(obj[fieldParts[0]])) {
    // If the next field is an integer, return only this item of the array
    const i = parseInt(fieldParts[1], 10)
    if (typeof i === 'number' && !isNaN(i)) return getDotValue(obj[fieldParts[0]][i], fieldParts.slice(2))

    // Return the array of values
    return obj[fieldParts[0]].map(el => getDotValue(el, fieldParts.slice(1)))
  } else return getDotValue(obj[fieldParts[0]], fieldParts.slice(1))
}

/**
 * Get dot values for either a bunch of fields or just one.
 */
const getDotValues = (obj, fields) => {
  if (!Array.isArray(fields)) throw new Error('fields must be an Array')
  if (fields.length > 1) {
    const key = {}
    for (const field of fields) {
      key[field] = getDotValue(obj, field)
    }
    return key
  } else return getDotValue(obj, fields[0])
}

/**
 * Check whether 'things' are equal
 * Things are defined as any native types (string, number, boolean, null, date) and objects
 * In the case of object, we check deep equality
 * Returns true if they are, false otherwise
 * @param {*} a
 * @param {*} a
 * @return {boolean}
 * @alias module:model.areThingsEqual
 */
const areThingsEqual = (a, b) => {
  // Strings, booleans, numbers, null
  if (
    a === null ||
    typeof a === 'string' ||
    typeof a === 'boolean' ||
    typeof a === 'number' ||
    b === null ||
    typeof b === 'string' ||
    typeof b === 'boolean' ||
    typeof b === 'number'
  ) return a === b

  // Dates
  if (isDate(a) || isDate(b)) return isDate(a) && isDate(b) && a.getTime() === b.getTime()

  // Arrays (no match since arrays are used as a $in)
  // undefined (no match since they mean field doesn't exist and can't be serialized)
  if (
    (!(Array.isArray(a) && Array.isArray(b)) && (Array.isArray(a) || Array.isArray(b))) ||
    a === undefined || b === undefined
  ) return false

  // General objects (check for deep equality)
  // a and b should be objects at this point
  let aKeys
  let bKeys
  try {
    aKeys = Object.keys(a)
    bKeys = Object.keys(b)
  } catch (e) {
    return false
  }

  if (aKeys.length !== bKeys.length) return false
  for (const el of aKeys) {
    if (bKeys.indexOf(el) === -1) return false
    if (!areThingsEqual(a[el], b[el])) return false
  }
  return true
}

/**
 * Check that two values are comparable
 * @param {*} a
 * @param {*} a
 * @return {boolean}
 * @private
 */
const areComparable = (a, b) => {
  if (
    typeof a !== 'string' &&
    typeof a !== 'number' &&
    !isDate(a) &&
    typeof b !== 'string' &&
    typeof b !== 'number' &&
    !isDate(b)
  ) return false

  if (typeof a !== typeof b) return false

  return true
}

/**
 * @callback comparisonOperator
 * Arithmetic and comparison operators
 * @param {*} a Value in the object
 * @param {*} b Value in the query
 * @return {boolean}
 */

/**
 * @enum {comparisonOperator}
 */
const comparisonFunctions = {
  /** Lower than */
  $lt: (a, b) => areComparable(a, b) && a < b,
  /** Lower than or equals */
  $lte: (a, b) => areComparable(a, b) && a <= b,
  /** Greater than */
  $gt: (a, b) => areComparable(a, b) && a > b,
  /** Greater than or equals */
  $gte: (a, b) => areComparable(a, b) && a >= b,
  /** Does not equal */
  $ne: (a, b) => a === undefined || !areThingsEqual(a, b),
  /** Is in Array */
  $in: (a, b) => {
    if (!Array.isArray(b)) throw new Error('$in operator called with a non-array')

    for (const el of b) {
      if (areThingsEqual(a, el)) return true
    }

    return false
  },
  /** Is not in Array */
  $nin: (a, b) => {
    if (!Array.isArray(b)) throw new Error('$nin operator called with a non-array')

    return !comparisonFunctions.$in(a, b)
  },
  /** Matches Regexp */
  $regex: (a, b) => {
    if (!isRegExp(b)) throw new Error('$regex operator called with non regular expression')

    if (typeof a !== 'string') return false
    else return b.test(a)
  },
  /** Returns true if field exists */
  $exists: (a, b) => {
    // This will be true for all values of stat except false, null, undefined and 0
    // That's strange behaviour (we should only use true/false) but that's the way Mongo does it...
    if (b || b === '') b = true
    else b = false

    if (a === undefined) return !b
    else return b
  },
  /** Specific to Arrays, returns true if a length equals b */
  $size: (a, b) => {
    if (!Array.isArray(a)) return false
    if (b % 1 !== 0) throw new Error('$size operator called without an integer')

    return a.length === b
  },
  /** Specific to Arrays, returns true if some elements of a match the query b */
  $elemMatch: (a, b) => {
    if (!Array.isArray(a)) return false
    return a.some(el => match(el, b))
  }
}

const arrayComparisonFunctions = { $size: true, $elemMatch: true }

/**
 * @enum
 */
const logicalOperators = {
  /**
   * Match any of the subqueries
   * @param {document} obj
   * @param {query[]} query
   * @return {boolean}
   */
  $or: (obj, query) => {
    if (!Array.isArray(query)) throw new Error('$or operator used without an array')

    for (let i = 0; i < query.length; i += 1) {
      if (match(obj, query[i])) return true
    }

    return false
  },
  /**
   * Match all of the subqueries
   * @param {document} obj
   * @param {query[]} query
   * @return {boolean}
   */
  $and: (obj, query) => {
    if (!Array.isArray(query)) throw new Error('$and operator used without an array')

    for (let i = 0; i < query.length; i += 1) {
      if (!match(obj, query[i])) return false
    }

    return true
  },
  /**
   * Inverted match of the query
   * @param {document} obj
   * @param {query} query
   * @return {boolean}
   */
  $not: (obj, query) => !match(obj, query),

  /**
   * @callback whereCallback
   * @param {document} obj
   * @return {boolean}
   */

  /**
   * Use a function to match
   * @param {document} obj
   * @param {whereCallback} fn
   * @return {boolean}
   */
  $where: (obj, fn) => {
    if (typeof fn !== 'function') throw new Error('$where operator used without a function')

    const result = fn.call(obj)
    if (typeof result !== 'boolean') throw new Error('$where function must return boolean')

    return result
  }
}

/**
 * Tell if a given document matches a query
 * @param {document} obj Document to check
 * @param {query} query
 * @return {boolean}
 * @alias module:model.match
 */
const match = (obj, query) => {
  // Primitive query against a primitive type
  // This is a bit of a hack since we construct an object with an arbitrary key only to dereference it later
  // But I don't have time for a cleaner implementation now
  if (isPrimitiveType(obj) || isPrimitiveType(query)) return matchQueryPart({ needAKey: obj }, 'needAKey', query)

  // Normal query
  for (const queryKey in query) {
    if (Object.prototype.hasOwnProperty.call(query, queryKey)) {
      const queryValue = query[queryKey]
      if (queryKey[0] === '$') {
        if (!logicalOperators[queryKey]) throw new Error(`Unknown logical operator ${queryKey}`)
        if (!logicalOperators[queryKey](obj, queryValue)) return false
      } else if (!matchQueryPart(obj, queryKey, queryValue)) return false
    }
  }

  return true
}

/**
 * Match an object against a specific { key: value } part of a query
 * if the treatObjAsValue flag is set, don't try to match every part separately, but the array as a whole
 * @param {object} obj
 * @param {string} queryKey
 * @param {*} queryValue
 * @param {boolean} [treatObjAsValue=false]
 * @return {boolean}
 * @private
 */
function matchQueryPart (obj, queryKey, queryValue, treatObjAsValue) {
  const objValue = getDotValue(obj, queryKey)

  // Check if the value is an array if we don't force a treatment as value
  if (Array.isArray(objValue) && !treatObjAsValue) {
    // If the queryValue is an array, try to perform an exact match
    if (Array.isArray(queryValue)) return matchQueryPart(obj, queryKey, queryValue, true)

    // Check if we are using an array-specific comparison function
    if (queryValue !== null && typeof queryValue === 'object' && !isRegExp(queryValue)) {
      for (const key in queryValue) {
        if (Object.prototype.hasOwnProperty.call(queryValue, key) && arrayComparisonFunctions[key]) { return matchQueryPart(obj, queryKey, queryValue, true) }
      }
    }

    // If not, treat it as an array of { obj, query } where there needs to be at least one match
    for (const el of objValue) {
      if (matchQueryPart({ k: el }, 'k', queryValue)) return true // k here could be any string
    }
    return false
  }

  // queryValue is an actual object. Determine whether it contains comparison operators
  // or only normal fields. Mixed objects are not allowed
  if (queryValue !== null && typeof queryValue === 'object' && !isRegExp(queryValue) && !Array.isArray(queryValue)) {
    const keys = Object.keys(queryValue)
    const firstChars = keys.map(item => item[0])
    const dollarFirstChars = firstChars.filter(c => c === '$')

    if (dollarFirstChars.length !== 0 && dollarFirstChars.length !== firstChars.length) throw new Error('You cannot mix operators and normal fields')

    // queryValue is an object of this form: { $comparisonOperator1: value1, ... }
    if (dollarFirstChars.length > 0) {
      for (const key of keys) {
        if (!comparisonFunctions[key]) throw new Error(`Unknown comparison function ${key}`)

        if (!comparisonFunctions[key](objValue, queryValue[key])) return false
      }
      return true
    }
  }

  // Using regular expressions with basic querying
  if (isRegExp(queryValue)) return comparisonFunctions.$regex(objValue, queryValue)

  // queryValue is either a native value or a normal object
  // Basic matching is possible
  return areThingsEqual(objValue, queryValue)
}

// Interface
module.exports.serialize = serialize
module.exports.deserialize = deserialize
module.exports.deepCopy = deepCopy
module.exports.checkObject = checkObject
module.exports.isPrimitiveType = isPrimitiveType
module.exports.modify = modify
module.exports.getDotValue = getDotValue
module.exports.getDotValues = getDotValues
module.exports.match = match
module.exports.areThingsEqual = areThingsEqual
module.exports.compareThings = compareThings
