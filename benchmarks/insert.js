const benchDb = 'workspace/insert.bench.db'
const async = require('async')
const ExecTime = require('exec-time')
const profiler = new ExecTime('INSERT BENCH')
const commonUtilities = require('./commonUtilities')
const config = commonUtilities.getConfiguration(benchDb)
const d = config.d
let n = config.n

async.waterfall([
  async.apply(commonUtilities.prepareDb, benchDb),
  function (cb) {
    d.loadDatabase(function (err) {
      if (err) { return cb(err) }
      if (config.program.withIndex) {
        d.ensureIndex({ fieldName: 'docNumber' })
        n = 2 * n // We will actually insert twice as many documents
        // because the index is slower when the collection is already
        // big. So the result given by the algorithm will be a bit worse than
        // actual performance
      }
      cb()
    })
  },
  function (cb) { profiler.beginProfiling(); return cb() },
  async.apply(commonUtilities.insertDocs, d, n, profiler)
], function (err) {
  profiler.step('Benchmark finished')

  if (err) { return console.log('An error was encountered: ', err) }
})
