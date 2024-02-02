import { callbackify, promisify } from 'util'

// Must use an intermediary variable, otherwise Rollup imports callbackify from util directly
// (along with crypto somehow) in files importing customUtils.
const _callbackify = callbackify
const waterfallAsync = async tasks => {
  for (const task of tasks) {
    await promisify(task)()
  }
}

const waterfall = _callbackify(waterfallAsync)

const eachAsync = async (arr, iterator) => Promise.all(arr.map(el => promisify(iterator)(el)))

const each = _callbackify(eachAsync)

const apply = function (fn) {
  const args = Array.prototype.slice.call(arguments, 1)
  return function () {
    return fn.apply(
      null, args.concat(Array.prototype.slice.call(arguments))
    )
  }
}

const whilstAsync = async (test, fn) => {
  while (test()) await promisify(fn)()
}

const whilst = _callbackify(whilstAsync)

const wait = delay => new Promise(resolve => {
  setTimeout(resolve, delay)
})

export {
  whilst,
  apply,
  waterfall,
  each,
  wait,
  _callbackify as callbackify
}
