const benchDb = 'workspace/find.bench.db'
const async = require('async')
const ExecTime = require('exec-time')
const profiler = new ExecTime('FIND BENCH')
const commonUtilities = require('./commonUtilities')
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
