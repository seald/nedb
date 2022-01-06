require('../jsdoc.conf')

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
     * Use {@link Waterfall#guardian} instead which retrievethe latest version of the guardian.
     * @type {Promise}
     * @protected
     */
    this._guardian = Promise.resolve()
  }

  /**
   * Getter that gives a Promise which resolves when all tasks up to when this function is called are done.
   *
   * This Promise cannot reject.
   * @return {Promise}
   */
  get guardian () {
    return this._guardian
  }

  /**
   *
   * @param {AsyncFunction} func
   * @return {AsyncFunction}
   */
  waterfall (func) {
    return (...args) => {
      this._guardian = this.guardian.then(() => {
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
