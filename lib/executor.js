/**
 * Responsible for sequentially executing actions on the database
 * @private
 */
class Waterfall {
  constructor () {
    /**
     * This is the internal Promise object which resolves when all the tasks of the `Waterfall` are done.
     *
     * It will change any time `this.waterfall` is called, this is why there is a getter `this.guardian` which retrieves
     * the latest version of the guardian.
     * @type {Promise<void>}
     * @private
     */
    this._guardian = Promise.resolve()
  }

  /**
   * Returns a Promise which resolves when all tasks up to when this function is called are done.
   *
   * This Promise cannot reject.
   * @return {Promise<void>}
   */
  get guardian () {
    return this._guardian
  }

  /**
   * @callback Waterfall~function
   * @param {...[*]} args
   * @return {Promise<*>}
   */

  /**
   *
   * @param {Waterfall~function} func
   * @return {Waterfall~function}
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

  chain (promise) {
    return this.waterfall(() => promise)()
  }
}

class Executor {
  constructor () {
    this.ready = false
    this.queue = new Waterfall()
    this.buffer = new Waterfall()
    this.buffer.chain(new Promise(resolve => {
      this.triggerBuffer = resolve
    }))
  }

  /**
   * If executor is ready, queue task (and process it immediately if executor was idle)
   * If not, buffer task for later processing
   * @param {Object} task
   *                 task.this - Object to use as this
   *                 task.fn - Function to execute
   *                 task.arguments - Array of arguments, IMPORTANT: only the last argument may be a function (the callback)
   *                                                                 and the last argument cannot be false/undefined/null
   * @param {Boolean} forceQueuing Optional (defaults to false) force executor to queue task even if it is not ready
   */
  push (task, forceQueuing) {
    const func = async () => {
      const lastArg = task.arguments[task.arguments.length - 1]
      await new Promise(resolve => {
        if (typeof lastArg === 'function') {
          // We got a callback
          task.arguments.pop() // remove original callback
          task.fn.apply(task.this, [...task.arguments, function () {
            resolve() // triggers next task after next tick
            lastArg.apply(null, arguments) // call original callback
          }])
        } else if (!lastArg && task.arguments.length !== 0) {
          // We got a falsy callback
          task.arguments.pop() // remove original callback
          task.fn.apply(task.this, [...task.arguments, () => {
            resolve()
          }])
        } else {
          // We don't have a callback
          task.fn.apply(task.this, [...task.arguments, () => {
            resolve()
          }])
        }
      })
    }
    this.pushAsync(func, forceQueuing)
  }

  pushAsync (task, forceQueuing) {
    if (this.ready || forceQueuing) return this.queue.waterfall(task)()
    else return this.buffer.waterfall(task)()
  }

  /**
   * Queue all tasks in buffer (in the same order they came in)
   * Automatically sets executor as ready
   */
  processBuffer () {
    this.ready = true
    this.triggerBuffer()
    this.queue.waterfall(() => this.buffer.guardian)
  }
}

// Interface
module.exports = Executor
