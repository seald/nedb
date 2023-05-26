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
export const uniq = <T>(
  array: Array<T>,
  iteratee: (v: T) => boolean
): Array<T> => {
  if (iteratee)
    return [...new Map(array.map((x) => [iteratee(x), x])).values()];
  else return [...new Set(array)];
};
/**
 * Returns true if arg is an Object. Note that JavaScript arrays and functions are objects, while (normal) strings
 * and numbers are not.
 *
 * Heavily inspired by {@link https://underscorejs.org/#isObject}.
 * @param {*} arg
 * @return {boolean}
 */
export const isObject = (arg: any): boolean =>
  typeof arg === "object" && arg !== null;

/**
 * Returns true if d is a Date.
 *
 * Heavily inspired by {@link https://underscorejs.org/#isDate}.
 * @param {*} d
 * @return {boolean}
 * @alias module:utils.isDate
 */
export const isDate = (d: any): boolean =>
  isObject(d) && Object.prototype.toString.call(d) === "[object Date]";

/**
 * Returns true if re is a RegExp.
 *
 * Heavily inspired by {@link https://underscorejs.org/#isRegExp}.
 * @param {*} re
 * @return {boolean}
 * @alias module:utils.isRegExp
 */
export const isRegExp = (re: any): boolean =>
  isObject(re) && Object.prototype.toString.call(re) === "[object RegExp]";

/**
 * Return a copy of the object filtered using the given keys.
 *
 * @param {object} object
 * @param {string[]} keys
 * @return {object}
 */
export const pick = (
  object: Record<string, any>,
  keys: string[]
): Record<string, any> => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {} as Record<string, any>);
};

export const filterIndexNames =
  (indexNames: string[]) =>
    ([k, v]: [string, any]) =>
      !!(
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        isDate(v) ||
        v === null
      ) && indexNames.includes(k);
