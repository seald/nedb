const { callbackify, promisify } = require('util')
const { promises: fs, constants: fsConstants } = require('fs')

const waterfallAsync = async tasks => {
  for (const task of tasks) {
    await promisify(task)()
  }
}

const waterfall = callbackify(waterfallAsync)

const eachAsync = async (arr, iterator) => Promise.all(arr.map(el => promisify(iterator)(el)))

const each = callbackify(eachAsync)

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

const whilst = callbackify(whilstAsync)

const wait = delay => new Promise(resolve => {
  setTimeout(resolve, delay)
})
const exists = path => fs.access(path, fsConstants.FS_OK).then(() => true, () => false)

module.exports.whilst = whilst
module.exports.apply = apply
module.exports.waterfall = waterfall
module.exports.each = each
module.exports.wait = wait
module.exports.exists = exists
