const async = require('async')
const commonUtilities = require('./commonUtilities')
const Profiler = require('./profiler')

const benchDb = 'workspace/find.bench.db'
const profiler = new Profiler('FIND BENCH')
const config = commonUtilities.getConfiguration(benchDb)
const d = config.d
const n = config.n

async.waterfall([
  async.apply(commonUtilities.prepareDb, benchDb),
  function (cb) {
    d.loadDatabase(function (err) {
      if (err) { return cb(err) }
      if (config.program.withIndex) { d.ensureIndex({ fieldName: 'docNumber' }) }
      cb()
    })
  },
  function (cb) { profiler.beginProfiling(); return cb() },
  async.apply(commonUtilities.insertDocs, d, n, profiler),
  async.apply(commonUtilities.findDocsWithIn, d, n, profiler)
], function (err) {
  profiler.step('Benchmark finished')

  if (err) { return console.log('An error was encountered: ', err) }
})
