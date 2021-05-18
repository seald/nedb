const async = require('async')
const program = require('commander')
const Datastore = require('../lib/datastore')
const commonUtilities = require('./commonUtilities')
const Profiler = require('./profiler')

const benchDb = 'workspace/loaddb.bench.db'
const profiler = new Profiler('LOADDB BENCH')
const d = new Datastore(benchDb)

program
  .option('-n --number [number]', 'Size of the collection to test on', parseInt)
  .option('-i --with-index', 'Test with an index')
  .parse(process.argv)

const n = program.number || 10000

console.log('----------------------------')
console.log('Test with ' + n + ' documents')
console.log(program.withIndex ? 'Use an index' : "Don't use an index")
console.log('----------------------------')

async.waterfall([
  async.apply(commonUtilities.prepareDb, benchDb),
  function (cb) {
    d.loadDatabase(cb)
  },
  function (cb) { profiler.beginProfiling(); return cb() },
  async.apply(commonUtilities.insertDocs, d, n, profiler),
  async.apply(commonUtilities.loadDatabase, d, n, profiler)
], function (err) {
  profiler.step('Benchmark finished')

  if (err) { return console.log('An error was encountered: ', err) }
})
