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
     * It never rejects: a task which fails resolves it with `{ error: true }` instead. This is what allows a
     * `Waterfall` to keep running tasks after one of them has failed, and it lets the guardian be chained into
     * another `Waterfall` (see {@link Executor#processBuffer}) without risking an unhandled rejection.
     *
     * @type {Promise}
     */
    this.guardian = Promise.resolve()
  }

  /**
   * Chains a task onto the `Waterfall`.
   *
   * The task is awaited inside a `try`/`catch` so that whatever it does - reject, throw synchronously, or return
   * a non-thenable - the guardian still resolves and the tasks queued behind it still run. The failure is reported
   * only to the caller, through the returned promise.
   *
   * @param {AsyncFunction} func
   * @return {AsyncFunction}
   */
  waterfall (func) {
    return (...args) => {
      this.guardian = this.guardian.then(async () => {
        try {
          return { error: false, result: await func(...args) }
        } catch (error) {
          return { error: true, result: error }
        }
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
