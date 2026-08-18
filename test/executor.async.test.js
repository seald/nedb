/* eslint-env mocha */
const testDb = 'workspace/test.db'
const { promises: fs } = require('fs')
const assert = require('assert').strict
const Datastore = require('../lib/datastore')
const Persistence = require('../lib/persistence')
const Executor = require('../lib/executor')
const { exists, wait } = require('./utils.test.js')

// Test that operations are executed in the right order
// We prevent Mocha from catching the exception we throw on purpose by remembering all current handlers, remove them and register them back after test ends
const testRightOrder = async d => {
  const docs = await d.findAsync({})
  assert.equal(docs.length, 0)

  await d.insertAsync({ a: 1 })
  await d.updateAsync({ a: 1 }, { a: 2 }, {})
  const docs2 = await d.findAsync({})
  assert.equal(docs2[0].a, 2)
  d.updateAsync({ a: 2 }, { a: 3 }, {}) // not awaiting
  d.executor.pushAsync(async () => { throw new Error('Some error') }) // not awaiting
  const docs3 = await d.findAsync({})
  assert.equal(docs3[0].a, 3)
}

// Note:  The following test does not have any assertion because it
// is meant to address the deprecation warning:
// (node) warning: Recursive process.nextTick detected. This will break in the next version of node. Please use setImmediate for recursive deferral.
// see
const testEventLoopStarvation = async d => {
  const times = 1001
  let i = 0
  while (i < times) {
    i++
    d.findAsync({ bogus: 'search' })
  }
  await d.findAsync({ bogus: 'search' })
}

// Test that operations are executed in the right order even with no callback
const testExecutorWorksWithoutCallback = async d => {
  d.insertAsync({ a: 1 })
  d.insertAsync({ a: 2 })
  const docs = await d.findAsync({})
  assert.equal(docs.length, 2)
}

describe('Executor async', function () {
  describe('With persistent database', async () => {
    let d

    beforeEach(async () => {
      d = new Datastore({ filename: testDb })
      assert.equal(d.filename, testDb)
      assert.equal(d.inMemoryOnly, false)
      await Persistence.ensureParentDirectoryExistsAsync(testDb)
      if (await exists(testDb)) await fs.unlink(testDb)
      await d.loadDatabaseAsync()
      assert.equal(d.getAllData().length, 0)
    })

    it('Operations are executed in the right order', () => testRightOrder(d))

    it('Does not starve event loop and raise warning when more than 1000 callbacks are in queue', () => testEventLoopStarvation(d))

    it('Works in the right order even with no supplied callback', () => testExecutorWorksWithoutCallback(d))
  })
}) // ==== End of 'With persistent database' ====

describe('With non persistent database', function () {
  let d

  beforeEach(async () => {
    d = new Datastore({ inMemoryOnly: true })
    assert.equal(d.inMemoryOnly, true)
    await d.loadDatabaseAsync()
    assert.equal(d.getAllData().length, 0)
  })

  it('Operations are executed in the right order', () => testRightOrder(d))

  it('Works in the right order even with no supplied callback', () => testExecutorWorksWithoutCallback(d))
}) // ==== End of 'With non persistent database' ====

// Regression tests for the barrier installed by Executor#processBuffer, which makes the main queue wait for the
// buffer to drain. This restores the ordering the executor had before it was rewritten to use two Waterfalls: the
// buffer used to be an inert array drained into a single async.queue with a concurrency of 1, so a task pushed
// after processBuffer could not possibly overlap a buffered one.
describe('Executor buffer barrier', function () {
  beforeEach(async () => {
    await Persistence.ensureParentDirectoryExistsAsync(testDb)
    if (await exists(testDb)) await fs.unlink(testDb)
  })

  it('A task pushed after processBuffer waits for the buffer to drain', async () => {
    const executor = new Executor()
    const events = []

    const buffered = executor.pushAsync(async () => {
      events.push('buffered start')
      await wait(50)
      events.push('buffered end')
    })

    executor.processBuffer()

    const queued = executor.pushAsync(async () => { events.push('queued start') })

    await Promise.all([buffered, queued])
    assert.deepEqual(events, ['buffered start', 'buffered end', 'queued start'])
  })

  it('A buffered task which fails does not stall the tasks queued behind the barrier', async () => {
    const executor = new Executor()
    executor.pushAsync(async () => { throw new Error('async boom') }).catch(() => {})
    executor.pushAsync(() => { throw new Error('sync boom') }).catch(() => {})
    executor.processBuffer()

    assert.equal(await executor.pushAsync(async () => 'ok'), 'ok')
  })

  it('processBuffer does not make dropDatabaseAsync wait on a buffer which will never be triggered', async () => {
    const executor = new Executor()
    executor.pushAsync(async () => { await wait(20) }).catch(() => {})
    executor.processBuffer()

    // Exactly what Persistence#dropDatabaseAsync does, in the same tick as processBuffer.
    executor.ready = false
    executor.resetBuffer()

    const outcome = await Promise.race([
      executor.queue.guardian.then(() => 'drained'),
      wait(1000).then(() => 'hung')
    ])
    assert.equal(outcome, 'drained')
  })

  it('A remove issued once loadDatabase resolves is not dropped by a buffered compaction', async () => {
    const N = 1000
    const seed = new Datastore({ filename: testDb })
    await seed.loadDatabaseAsync()
    for (let i = 0; i < N; i++) await seed.insertAsync({ _id: `doc${i}`, i, pad: 'x'.repeat(200) })
    await seed.compactDatafileAsync()

    // The executor is not ready yet, so this compaction lands in the buffer.
    const db = new Datastore({ filename: testDb })
    const events = []
    db.on('compaction.done', () => events.push('compaction.done'))
    const bufferedCompaction = db.compactDatafileAsync()

    await db.loadDatabaseAsync() // force-queued, calls processBuffer at its end
    events.push('loadDatabase resolved')

    const numRemoved = await db.removeAsync({ _id: 'doc7' }, {})
    events.push('remove resolved')
    await bufferedCompaction

    assert.equal(numRemoved, 1)
    assert.deepEqual(events, [
      'compaction.done', // from loadDatabase's own persistCachedDatabase
      'loadDatabase resolved',
      'compaction.done', // the buffered one, which must finish first
      'remove resolved'
    ])
    assert.equal((await db.findAsync({})).length, N - 1)

    // The removal must have survived on disk, not only in memory.
    const reloaded = new Datastore({ filename: testDb })
    await reloaded.loadDatabaseAsync()
    assert.equal((await reloaded.findAsync({ _id: 'doc7' })).length, 0)
    assert.equal((await reloaded.findAsync({})).length, N - 1)
  })
}) // ==== End of 'Executor buffer barrier' ====
