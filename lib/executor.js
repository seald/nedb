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
   *
   * The main queue is made to wait for the buffer to drain, so that a task pushed after this call cannot overlap
   * one which was still buffered. Without this barrier a `remove` could run alongside a buffered compaction and see
   * its `$$deleted` marker discarded when the compaction renames its temp file over the datafile.
   *
   * `this.buffer` is read now rather than from inside the callback, because {@link Executor#resetBuffer} may swap it
   * for a fresh, untriggered one before the callback runs - which would make the main queue wait forever.
   */
  processBuffer () {
    this.ready = true
    this._triggerBuffer()
    const buffer = this.buffer
    // This promise is deliberately not awaited, so it gets a terminal handler. The guardian never rejects, and
    // errors are reported to each task's own pushAsync caller anyway.
    this.queue.waterfall(() => buffer.guardian)().catch(() => {})
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
