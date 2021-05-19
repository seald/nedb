/**
 * Responsible for sequentially executing actions on the database
 */
const async = require('async')

class Executor {
  constructor () {
    this.buffer = []
    this.ready = false

    // This queue will execute all commands, one-by-one in order
    this.queue = async.queue((task, cb) => {
      // task.arguments is an array-like object on which adding a new field doesn't work, so we transform it into a real array
      const newArguments = Array.from(task.arguments)

      const lastArg = newArguments[newArguments.length - 1]

      // Always tell the queue task is complete. Execute callback if any was given.
      if (typeof lastArg === 'function') {
        // Callback was supplied
        newArguments[newArguments.length - 1] = function () {
          if (typeof setImmediate === 'function') {
            setImmediate(cb)
          } else {
            process.nextTick(cb)
          }
          lastArg.apply(null, arguments)
        }
      } else if (!lastArg && task.arguments.length !== 0) {
        // false/undefined/null supplied as callback
        newArguments[newArguments.length - 1] = () => { cb() }
      } else {
        // Nothing supplied as callback
        newArguments.push(() => { cb() })
      }

      task.fn.apply(task.this, newArguments)
    }, 1)
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
    if (this.ready || forceQueuing) this.queue.push(task)
    else this.buffer.push(task)
  }

  /**
   * Queue all tasks in buffer (in the same order they came in)
   * Automatically sets executor as ready
   */
  processBuffer () {
    this.ready = true
    this.buffer.forEach(task => { this.queue.push(task) })
    this.buffer = []
  }
}

// Interface
module.exports = Executor
