const Waterfall = require('./waterfall')

/**
 * Executes operations sequentially.
 * Has an option for a buffer that can be triggered afterwards.
 * @private
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
    this.buffer = null
    /**
     * Method to trigger the buffer processing.
     *
     * Do not be use directly, use `this.processBuffer` instead.
     * @function
     * @private
     */
    this._triggerBuffer = null
    this.resetBuffer()
  }

  /**
   * If executor is ready, queue task (and process it immediately if executor was idle)
   * If not, buffer task for later processing
   * @param {AsyncFunction} task Function to execute
   * @param {boolean} [forceQueuing = false] Optional (defaults to false) force executor to queue task even if it is not ready
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

  /**
   * Removes all tasks queued up in the buffer
   */
  resetBuffer () {
    this.buffer = new Waterfall()
    this.buffer.chain(new Promise(resolve => {
      this._triggerBuffer = resolve
    }))
    if (this.ready) this._triggerBuffer()
  }
}

// Interface
module.exports = Executor
