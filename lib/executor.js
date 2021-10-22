/**
 * Responsible for sequentially executing actions on the database
 */

class Queue {
  constructor (execute) {
    this.execute = execute
    this.tasks = new Map()
    this.buffer = new Map()
    this.running = false
    this.drainPromise = Promise.resolve()
  }

  async executeNextTask (force = false) {
    if (!this.tasks.size) {
      this.running = false
      return
    } else if (this.running && !force) return
    this.running = true
    const [task, { resolve, reject, async }] = this.tasks[Symbol.iterator]().next().value

    this.tasks.delete(task)
    try {
      resolve(await this.execute(task, async))
    } catch (err) {
      reject(err)
    }
    this.drainPromise = this.executeNextTask(true)
  }

  _push (task, async, map, run = false) {
    let _resolve, _reject
    const promise = new Promise((resolve, reject) => {
      _reject = reject
      _resolve = resolve
    })
    map.set(task, { async: async, resolve: _resolve, reject: _reject })
    if (run && !this.running) this.drainPromise = this.executeNextTask()
    return promise
  }

  push (task) {
    this._push(task, false, this.tasks, true).then(() => {}, () => {}) // to avoid having unhandledRejection
  }

  pushAsync (task) {
    return this._push(task, true, this.tasks, true)
  }

  addToBuffer (task) {
    this._push(task, false, this.buffer, false).then(() => {}, () => {}) // to avoid having unhandledRejection
  }

  addToBufferAsync (task) {
    return this._push(task, true, this.buffer, false)
  }

  processBuffer () {
    this.tasks = new Map([...this.tasks, ...this.buffer])
    this.buffer = new Map()
    this.drainPromise = this.executeNextTask()
  }

  async drain () {
    return this.drainPromise
  }
}

class Executor {
  constructor () {
    this.ready = false

    this.queue = new Queue(async (task, async) => {
      // If the task isn't async, let's proceed with the old handler
      if (!async) {
        const lastArg = task.arguments[task.arguments.length - 1]
        await new Promise(resolve => {
          if (typeof lastArg === 'function') {
            // We got a callback
            task.arguments.pop() // remove original callback
            task.fn.apply(task.this, [...task.arguments, function () {
              resolve() // triggers next task after next tick // TODO: check if it's at next tick or not
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
      } else {
        return task.fn.apply(task.this, task.arguments)
      }
    })
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
    else this.queue.addToBuffer(task)
  }

  pushAsync (task, forceQueuing) {
    if (this.ready || forceQueuing) return this.queue.pushAsync(task)
    else return this.queue.addToBufferAsync(task)
  }

  /**
   * Queue all tasks in buffer (in the same order they came in)
   * Automatically sets executor as ready
   */
  processBuffer () {
    this.ready = true
    this.queue.processBuffer()
  }
}

// Interface
module.exports = Executor
