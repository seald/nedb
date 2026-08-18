/* eslint-env mocha */
const assert = require('assert').strict
const Waterfall = require('../lib/waterfall')
const { wait } = require('./utils.test.js')

describe('Waterfall', function () {
  it('runs tasks sequentially and resolves with their results', async () => {
    const w = new Waterfall()
    const events = []
    const slow = w.waterfall(async () => { events.push('a start'); await wait(30); events.push('a end'); return 'a' })()
    const fast = w.waterfall(async () => { events.push('b start'); return 'b' })()

    assert.equal(await slow, 'a')
    assert.equal(await fast, 'b')
    assert.deepEqual(events, ['a start', 'a end', 'b start'])
  })

  it('reports a rejection to its caller', async () => {
    const w = new Waterfall()
    await assert.rejects(
      w.waterfall(async () => { throw new Error('async boom') })(),
      { message: 'async boom' }
    )
  })

  it('reports a synchronous throw to its caller', async () => {
    const w = new Waterfall()
    await assert.rejects(
      w.waterfall(() => { throw new Error('sync boom') })(),
      { message: 'sync boom' }
    )
  })

  it('keeps running the tasks queued behind one which rejects', async () => {
    const w = new Waterfall()
    const events = []
    const a = w.waterfall(async () => { events.push('a ran'); throw new Error('async boom') })()
    const b = w.waterfall(async () => { events.push('b ran'); return 'b' })()

    await assert.rejects(a, { message: 'async boom' })
    assert.equal(await b, 'b')
    assert.deepEqual(events, ['a ran', 'b ran'])
  })

  it('keeps running the tasks queued behind one which throws synchronously', async () => {
    const w = new Waterfall()
    const events = []
    const a = w.waterfall(() => { events.push('a ran'); throw new Error('sync boom') })()
    const b = w.waterfall(async () => { events.push('b ran'); return 'b' })()

    await assert.rejects(a, { message: 'sync boom' })
    assert.equal(await b, 'b')
    assert.deepEqual(events, ['a ran', 'b ran'])
  })

  it('tolerates a task which does not return a promise', async () => {
    const w = new Waterfall()
    assert.equal(await w.waterfall(() => 42)(), 42)
    assert.equal(await w.waterfall(async () => 'still alive')(), 'still alive')
  })

  it('has a guardian which never rejects, whatever the tasks do', async () => {
    const w = new Waterfall()
    w.waterfall(async () => { throw new Error('async boom') })().catch(() => {})
    w.waterfall(() => { throw new Error('sync boom') })().catch(() => {})
    w.waterfall(() => undefined)().catch(() => {})

    // Would throw an unhandled rejection, or hang, if the guardian could reject.
    await w.guardian
    assert.equal(await w.waterfall(async () => 'ok')(), 'ok')
  })

  it('passes its arguments through to the task', async () => {
    const w = new Waterfall()
    assert.equal(await w.waterfall(async (a, b) => a + b)(1, 2), 3)
  })

  it('chains a promise onto the waterfall', async () => {
    const w = new Waterfall()
    const events = []
    w.chain(wait(20).then(() => events.push('chained')))
    const after = w.waterfall(async () => { events.push('after'); return 'after' })()

    assert.equal(await after, 'after')
    assert.deepEqual(events, ['chained', 'after'])
  })
})
