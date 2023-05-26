/**
 * Functions that are used in several benchmark tests
 */
const fs = require('fs')
const path = require('path')
const Datastore = require('../lib/datastore')
const Persistence = require('../lib/persistence')
const { callbackify } = require('util')
let executeAsap

try {
  executeAsap = setImmediate
} catch (e) {
  executeAsap = process.nextTick
}

/**
 * Configure the benchmark
 */
module.exports.getConfiguration = function (benchDb) {
  const program = require('commander')

  program
    .option('-n --number [number]', 'Size of the collection to test on', parseInt)
    .option('-i --with-index', 'Use an index')
    .option('-m --in-memory', 'Test with an in-memory only store')
    .parse(process.argv)

  const n = program.number || 10000

  console.log('----------------------------')
  console.log('Test with ' + n + ' documents')
  console.log(program.withIndex ? 'Use an index' : 'Don\'t use an index')
  console.log(program.inMemory ? 'Use an in-memory datastore' : 'Use a persistent datastore')
  console.log('----------------------------')

  const d = new Datastore({
    filename: benchDb,
    inMemoryOnly: program.inMemory
  })

  return { n, d, program }
}

/**
 * Ensure the workspace stat and the db datafile is empty
 */
module.exports.prepareDb = function (filename, cb) {
  callbackify((dirname) => Persistence.ensureDirectoryExistsAsync(dirname))(path.dirname(filename), function () {
    fs.access(filename, fs.constants.FS_OK, function (err) {
      if (!err) {
        fs.unlink(filename, cb)
      } else { return cb() }
    })
  })
}

/**
 * Return an array with the numbers from 0 to n-1, in a random order
 * Uses Fisher Yates algorithm
 * Useful to get fair tests
 */
function getRandomArray (n) {
  const res = []
  let i
  let j
  let temp

  for (i = 0; i < n; i += 1) { res[i] = i }

  for (i = n - 1; i >= 1; i -= 1) {
    j = Math.floor((i + 1) * Math.random())
    temp = res[i]
    res[i] = res[j]
    res[j] = temp
  }

  return res
}
module.exports.getRandomArray = getRandomArray

/**
 * Insert a certain number of documents for testing
 */
module.exports.insertDocs = function (d, n, profiler, cb) {
  const order = getRandomArray(n)

  profiler.step('Begin inserting ' + n + ' docs')

  function runFrom (i) {
    if (i === n) { // Finished
      const opsPerSecond = Math.floor(1000 * n / profiler.elapsedSinceLastStep())
      console.log('===== RESULT (insert) ===== ' + opsPerSecond + ' ops/s')
      profiler.step('Finished inserting ' + n + ' docs')
      profiler.insertOpsPerSecond = opsPerSecond
      return cb()
    }

    // eslint-disable-next-line n/handle-callback-err
    d.insert({ docNumber: order[i] }, function (err) {
      executeAsap(function () {
        runFrom(i + 1)
      })
    })
  }

  runFrom(0)
}

/**
 * Find documents with find
 */
module.exports.findDocs = function (d, n, profiler, cb) {
  const order = getRandomArray(n)

  profiler.step('Finding ' + n + ' documents')

  function runFrom (i) {
    if (i === n) { // Finished
      console.log('===== RESULT (find) ===== ' + Math.floor(1000 * n / profiler.elapsedSinceLastStep()) + ' ops/s')
      profiler.step('Finished finding ' + n + ' docs')
      return cb()
    }

    // eslint-disable-next-line n/handle-callback-err
    d.find({ docNumber: order[i] }, function (err, docs) {
      if (docs.length !== 1 || docs[0].docNumber !== order[i]) { return cb(new Error('One find didnt work')) }
      executeAsap(function () {
        runFrom(i + 1)
      })
    })
  }

  runFrom(0)
}

/**
 * Find documents with find and the $in operator
 */
module.exports.findDocsWithIn = function (d, n, profiler, cb) {
  const ins = []
  const arraySize = Math.min(10, n)

  // Preparing all the $in arrays, will take some time
  for (let i = 0; i < n; i += 1) {
    ins[i] = []

    for (let j = 0; j < arraySize; j += 1) {
      ins[i].push((i + j) % n)
    }
  }

  profiler.step('Finding ' + n + ' documents WITH $IN OPERATOR')

  function runFrom (i) {
    if (i === n) { // Finished
      console.log('===== RESULT (find with in selector) ===== ' + Math.floor(1000 * n / profiler.elapsedSinceLastStep()) + ' ops/s')
      profiler.step('Finished finding ' + n + ' docs')
      return cb()
    }

    // eslint-disable-next-line n/handle-callback-err
    d.find({ docNumber: { $in: ins[i] } }, function (err, docs) {
      if (docs.length !== arraySize) { return cb(new Error('One find didnt work')) }
      executeAsap(function () {
        runFrom(i + 1)
      })
    })
  }

  runFrom(0)
}

/**
 * Find documents with findOne
 */
module.exports.findOneDocs = function (d, n, profiler, cb) {
  const order = getRandomArray(n)

  profiler.step('FindingOne ' + n + ' documents')

  function runFrom (i) {
    if (i === n) { // Finished
      console.log('===== RESULT (findOne) ===== ' + Math.floor(1000 * n / profiler.elapsedSinceLastStep()) + ' ops/s')
      profiler.step('Finished finding ' + n + ' docs')
      return cb()
    }

    // eslint-disable-next-line n/handle-callback-err
    d.findOne({ docNumber: order[i] }, function (err, doc) {
      if (!doc || doc.docNumber !== order[i]) { return cb(new Error('One find didnt work')) }
      executeAsap(function () {
        runFrom(i + 1)
      })
    })
  }

  runFrom(0)
}

/**
 * Update documents
 * options is the same as the options object for update
 */
module.exports.updateDocs = function (options, d, n, profiler, cb) {
  const order = getRandomArray(n)

  profiler.step('Updating ' + n + ' documents')

  function runFrom (i) {
    if (i === n) { // Finished
      console.log('===== RESULT (update) ===== ' + Math.floor(1000 * n / profiler.elapsedSinceLastStep()) + ' ops/s')
      profiler.step('Finished updating ' + n + ' docs')
      return cb()
    }

    // Will not actually modify the document but will take the same time
    d.update({ docNumber: order[i] }, { docNumber: order[i] }, options, function (err, nr) {
      if (err) { return cb(err) }
      if (nr !== 1) { return cb(new Error('One update didnt work')) }
      executeAsap(function () {
        runFrom(i + 1)
      })
    })
  }

  runFrom(0)
}

/**
 * Remove documents
 * options is the same as the options object for update
 */
module.exports.removeDocs = function (options, d, n, profiler, cb) {
  const order = getRandomArray(n)

  profiler.step('Removing ' + n + ' documents')

  function runFrom (i) {
    if (i === n) { // Finished
      // opsPerSecond corresponds to 1 insert + 1 remove, needed to keep collection size at 10,000
      // We need to subtract the time taken by one insert to get the time actually taken by one remove
      const opsPerSecond = Math.floor(1000 * n / profiler.elapsedSinceLastStep())
      const removeOpsPerSecond = Math.floor(1 / ((1 / opsPerSecond) - (1 / profiler.insertOpsPerSecond)))
      console.log('===== RESULT (remove) ===== ' + removeOpsPerSecond + ' ops/s')
      profiler.step('Finished removing ' + n + ' docs')
      return cb()
    }

    d.remove({ docNumber: order[i] }, options, function (err, nr) {
      if (err) { return cb(err) }
      if (nr !== 1) { return cb(new Error('One remove didnt work')) }
      // eslint-disable-next-line n/handle-callback-err
      d.insert({ docNumber: order[i] }, function (err) { // We need to reinsert the doc so that we keep the collection's size at n
        // So actually we're calculating the average time taken by one insert + one remove
        executeAsap(function () {
          runFrom(i + 1)
        })
      })
    })
  }

  runFrom(0)
}

/**
 * Load database
 */
module.exports.loadDatabase = function (d, n, profiler, cb) {
  profiler.step('Loading the database ' + n + ' times')

  function runFrom (i) {
    if (i === n) { // Finished
      console.log('===== RESULT ===== ' + Math.floor(1000 * n / profiler.elapsedSinceLastStep()) + ' ops/s')
      profiler.step('Finished loading a database' + n + ' times')
      return cb()
    }

    // eslint-disable-next-line n/handle-callback-err
    d.loadDatabase(function (err) {
      executeAsap(function () {
        runFrom(i + 1)
      })
    })
  }

  runFrom(0)
}
