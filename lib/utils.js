/**
 * Utility functions for all environments.
 * This replaces the underscore dependency.
 *
 * @module utils
 * @private
 */

/**
 * @callback IterateeFunction
 * @param {*} arg
 * @return {*}
 */

/**
 * Produces a duplicate-free version of the array, using === to test object equality. In particular only the first
 * occurrence of each value is kept. If you want to compute unique items based on a transformation, pass an iteratee
 * function.
 *
 * Heavily inspired by {@link https://underscorejs.org/#uniq}.
 * @param {Array} array
 * @param {IterateeFunction} [iteratee] transformation applied to every element before checking for duplicates. This will not
 * transform the items in the result.
 * @return {Array}
 * @alias module:utils.uniq
 */
const uniq = (array, iteratee) => {
  if (iteratee) return [...(new Map(array.map(x => [iteratee(x), x]))).values()]
  else return [...new Set(array)]
}
/**
 * Returns true if arg is an Object. Note that JavaScript arrays and functions are objects, while (normal) strings
 * and numbers are not.
 *
 * Heavily inspired by {@link https://underscorejs.org/#isObject}.
 * @param {*} arg
 * @return {boolean}
 */
const isObject = arg => typeof arg === 'object' && arg !== null

/**
 * Returns true if d is a Date.
 *
 * Heavily inspired by {@link https://underscorejs.org/#isDate}.
 * @param {*} d
 * @return {boolean}
 * @alias module:utils.isDate
 */
const isDate = d => isObject(d) && Object.prototype.toString.call(d) === '[object Date]'

/**
 * Returns true if re is a RegExp.
 *
 * Heavily inspired by {@link https://underscorejs.org/#isRegExp}.
 * @param {*} re
 * @return {boolean}
 * @alias module:utils.isRegExp
 */
const isRegExp = re => isObject(re) && Object.prototype.toString.call(re) === '[object RegExp]'

/**
 * Return a copy of the object filtered using the given keys.
 *
 * @param {object} object
 * @param {string[]} keys
 * @return {object}
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key]
    }
    return obj
  }, {})
}

const filterIndexNames = (indexNames) => ([k, v]) => !!(typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || isDate(v) || v === null) &&
indexNames.includes(k)

module.exports.uniq = uniq
module.exports.isDate = isDate
module.exports.isRegExp = isRegExp
module.exports.pick = pick
module.exports.filterIndexNames = filterIndexNames
