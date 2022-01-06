const Waterfall = require('./waterfall')

/**
 * Executes operations sequentially.
 * Has an option for a buffer that can be triggered afterwards.
 */
class Executor {
  /**
   * Instantiates a new Executor.
   */
  constructor () {
    /**
     * If this.ready is `false`, then every task pushed will be buffered until this.processBuffer is called.
     * @type {boolean}
     * @private
     */
    this.ready = false
    /**
     * The main queue
     * @type {Waterfall}
     * @private
     */
    this.queue = new Waterfall()
    /**
     * The buffer queue
     * @type {Waterfall}
     * @private
     */
    this.buffer = new Waterfall()
    this.buffer.chain(new Promise(resolve => {
      /**
       * Method to trigger the buffer processing.
       *
       * Do not be use directly, use `this.processBuffer` instead.
       * @function
       * @private
       */
      this._triggerBuffer = resolve
    }))
  }

  /**
   * If executor is ready, queue task (and process it immediately if executor was idle)
   * If not, buffer task for later processing
   * @param {Object} task
   * @param {Object} task.this - Object to use as this
   * @param {function} task.fn - Function to execute
   * @param {Array} task.arguments - Array of arguments, IMPORTANT: only the last argument may be a function
   * (the callback) and the last argument cannot be false/undefined/null
   * @param {Boolean} [forceQueuing = false] Optional (defaults to false) force executor to queue task even if it is not ready
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

  /**
   * Async version of {@link Executor#push}.
   * This version is way simpler than its callbackEquivalent: you give it an async function `task`, it is executed when
   * all the previous tasks are done, and then resolves or rejects and when it is finished with its original result or
   * error.
   * @param {AsyncFunction} task
   * @param {boolean} [forceQueuing = false]
   * @return {Promise<*>}
   * @async
   * @see Executor#push
   */
  pushAsync (task, forceQueuing = false) {
    if (this.ready || forceQueuing) return this.queue.waterfall(task)()
    else return this.buffer.waterfall(task)()
  }

  /**
   * Queue all tasks in buffer (in the same order they came in)
   * Automatically sets executor as ready
   */
  processBuffer () {
    this.ready = true
    this._triggerBuffer()
    this.queue.waterfall(() => this.buffer.guardian)
  }
}

// Interface
module.exports = Executor
