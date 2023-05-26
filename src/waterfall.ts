/**
 * Responsible for sequentially executing actions on the database
 * @private
 */
class Waterfall {
  /**
   * Instantiate a new Waterfall.
   */
  constructor () {
    /**
     * This is the internal Promise object which resolves when all the tasks of the `Waterfall` are done.
     *
     * It will change any time `this.waterfall` is called.
     *
     * @type {Promise}
     */
    this.guardian = Promise.resolve()
  }

  /**
   *
   * @param {AsyncFunction} func
   * @return {AsyncFunction}
   */
  waterfall (func) {
    return (...args) => {
      this.guardian = this.guardian.then(() => {
        return func(...args)
          .then(result => ({ error: false, result }), result => ({ error: true, result }))
      })
      return this.guardian.then(({ error, result }) => {
        if (error) return Promise.reject(result)
        else return Promise.resolve(result)
      })
    }
  }

  /**
   * Shorthand for chaining a promise to the Waterfall
   * @param {Promise} promise
   * @return {Promise}
   */
  chain (promise) {
    return this.waterfall(() => promise)()
  }
}

module.exports = Waterfall
