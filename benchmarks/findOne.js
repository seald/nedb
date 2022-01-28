const { apply, waterfall } = require('../test/utils.test.js')
const commonUtilities = require('./commonUtilities')
const Profiler = require('./profiler')

const benchDb = 'workspace/findOne.bench.db'
const profiler = new Profiler('FINDONE BENCH')
const config = commonUtilities.getConfiguration(benchDb)
const d = config.d
const n = config.n

waterfall([
  apply(commonUtilities.prepareDb, benchDb),
  function (cb) {
    d.loadDatabase(function (err) {
      if (err) { return cb(err) }
      if (config.program.withIndex) { d.ensureIndex({ fieldName: 'docNumber' }) }
      cb()
    })
  },
  function (cb) { profiler.beginProfiling(); return cb() },
  apply(commonUtilities.insertDocs, d, n, profiler),
  function (cb) { setTimeout(function () { cb() }, 500) },
  apply(commonUtilities.findOneDocs, d, n, profiler)
], function (err) {
  profiler.step('Benchmark finished')

  if (err) { return console.log('An error was encountered: ', err) }
})
