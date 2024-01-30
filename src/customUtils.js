/**
 * Utility functions that need to be reimplemented for each environment.
 * This is the version for Node.js
 * @module customUtilsNode
 * @private
 */
import { randomBytes } from 'crypto'
import { callbackify } from 'util'

// Must use an intermediary variable, otherwise Rollup imports callbackify from util directly
// (along with crypto somehow) in files importing customUtils.

const _callbackify = callbackify
/**
 * Return a random alphanumerical string of length len
 * There is a very small probability (less than 1/1,000,000) for the length to be less than len
 * (il the base64 conversion yields too many pluses and slashes) but
 * that's not an issue here
 * The probability of a collision is extremely small (need 3*10^12 documents to have one chance in a million of a collision)
 * See http://en.wikipedia.org/wiki/Birthday_problem
 * @param {number} len
 * @return {string}
 * @alias module:customUtilsNode.uid
 */
const uid = len => randomBytes(Math.ceil(Math.max(8, len * 2)))
  .toString('base64')
  .replace(/[+/]/g, '')
  .slice(0, len)

export { uid, _callbackify as callbackify }
