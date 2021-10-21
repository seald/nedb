/**
 * Responsible for sequentially executing actions on the database
 */

const makeQueue = execute => {
  const tasks = new Map()
  let running = false
  let drainPromise = Promise.resolve()
  const executeNextTask = async (self = false) => {
    if (!tasks.size) {
      running = false
      return
    } else if (running && !self) {
      return
    }
    running = true
    const [task, { resolve, reject }] = tasks[Symbol.iterator]().next().value

    tasks.delete(task)
    try {
      resolve(await execute(task))
    } catch (err) {
      reject(err)
    }
    drainPromise = executeNextTask(true)
  }

  return {
    push (task) {
      let _resolve, _reject
      const promise = new Promise((resolve, reject) => {
        _reject = reject
        _resolve = resolve
      })
      tasks.set(task, { resolve: _resolve, reject: _reject })
      if (!running) drainPromise = executeNextTask()
      return promise
    },
    async drain () {
      return drainPromise
    }
  }
}

class Executor {
  constructor () {
    this.buffer = []
    this.ready = false

    this.queue = makeQueue(async task => {
      // task.arguments is an array-like object on which adding a new field doesn't work, so we transform it into a real array
      const newArguments = Array.from(task.arguments)

      // If the task isn't async, let's proceed with the old handler
      if (!task.async) {
        const lastArg = newArguments[newArguments.length - 1]
        await new Promise(resolve => {
          if (typeof lastArg === 'function') {
            // We got a callback
            newArguments.pop() // remove original callback
            task.fn.apply(task.this, [...newArguments, function () {
              resolve() // triggers next task after next tick
              lastArg.apply(null, arguments) // call original callback
            }])
          } else if (!lastArg && task.arguments.length !== 0) {
            // We got a falsy callback
            newArguments.pop() // remove original callback
            task.fn.apply(task.this, [...newArguments, () => {
              resolve()
            }])
          } else {
            // We don't have a callback
            task.fn.apply(task.this, [...newArguments, () => {
              resolve()
            }])
          }
        })
      } else {
        await task.fn.apply(task.this, newArguments)
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
