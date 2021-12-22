/* eslint-env mocha */
const testDb = 'workspace/test.db'
const { promises: fs } = require('fs')
const path = require('path')
const assert = require('assert').strict
const { exists } = require('./utils.test.js')
const model = require('../lib/model')
const Datastore = require('../lib/datastore')
const Persistence = require('../lib/persistence')
const storage = require('../lib/storage')
const { execFile, fork } = require('child_process')
const { promisify } = require('util')
const Readable = require('stream').Readable

describe('Persistence async', function () {
  let d

  beforeEach(async () => {
    d = new Datastore({ filename: testDb })
    assert.equal(d.filename, testDb)
    assert.equal(d.inMemoryOnly, false)
    await Persistence.ensureDirectoryExistsAsync(path.dirname(testDb))
    if (await exists(testDb)) await fs.unlink(testDb)
    await d.loadDatabaseAsync()
    assert.equal(d.getAllData().length, 0)
  })

  it('Every line represents a document', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '3', nested: { today: now } })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort((a, b) => a._id - b._id)
    assert.equal(treatedData.length, 3)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '2', hello: 'world' })
    assert.deepEqual(treatedData[2], { _id: '3', nested: { today: now } })
  })

  it('Every line represents a document (with stream)', async () => {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '3', nested: { today: now } })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    const result = await d.persistence.treatRawStreamAsync(stream)
    const treatedData = result.data
    treatedData.sort((a, b) => a._id - b._id)
    assert.equal(treatedData.length, 3)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '2', hello: 'world' })
    assert.deepEqual(treatedData[2], { _id: '3', nested: { today: now } })
  })

  it('Badly formatted lines have no impact on the treated data', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      'garbage\n' +
      model.serialize({ _id: '3', nested: { today: now } })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort((a, b) => a._id - b._id)
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '3', nested: { today: now } })
  })

  it('Badly formatted lines have no impact on the treated data (with stream)', async () => {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      'garbage\n' +
      model.serialize({ _id: '3', nested: { today: now } })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    const result = await d.persistence.treatRawStreamAsync(stream)
    const treatedData = result.data
    treatedData.sort((a, b) => a._id - b._id)
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '3', nested: { today: now } })
  })

  it('Well formatted lines that have no _id are not included in the data', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ nested: { today: now } })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort((a, b) => a._id - b._id)
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '2', hello: 'world' })
  })

  it('Well formatted lines that have no _id are not included in the data (with stream)', async () => {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ nested: { today: now } })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    const result = await d.persistence.treatRawStreamAsync(stream)
    const treatedData = result.data
    treatedData.sort(function (a, b) { return a._id - b._id })
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '2', hello: 'world' })
  })

  it('If two lines concern the same doc (= same _id), the last one is the good version', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '1', nested: { today: now } })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort((a, b) => a._id - b._id)
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', nested: { today: now } })
    assert.deepEqual(treatedData[1], { _id: '2', hello: 'world' })
  })

  it('If two lines concern the same doc (= same _id), the last one is the good version (with stream)', async () => {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '1', nested: { today: now } })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    const result = await d.persistence.treatRawStreamAsync(stream)
    const treatedData = result.data
    treatedData.sort(function (a, b) { return a._id - b._id })
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', nested: { today: now } })
    assert.deepEqual(treatedData[1], { _id: '2', hello: 'world' })
  })

  it('If a doc contains $$deleted: true, that means we need to remove it from the data', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '1', $$deleted: true }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort((a, b) => a._id - b._id)
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '2', hello: 'world' })
    assert.deepEqual(treatedData[1], { _id: '3', today: now })
  })

  it('If a doc contains $$deleted: true, that means we need to remove it from the data (with stream)', async () => {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '1', $$deleted: true }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    const result = await d.persistence.treatRawStreamAsync(stream)
    const treatedData = result.data
    treatedData.sort(function (a, b) { return a._id - b._id })
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '2', hello: 'world' })
    assert.deepEqual(treatedData[1], { _id: '3', today: now })
  })

  it('If a doc contains $$deleted: true, no error is thrown if the doc wasnt in the list before', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', $$deleted: true }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort((a, b) => a._id - b._id)
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '3', today: now })
  })

  it('If a doc contains $$deleted: true, no error is thrown if the doc wasnt in the list before (with stream)', async () => {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', $$deleted: true }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    const result = await d.persistence.treatRawStreamAsync(stream)
    const treatedData = result.data
    treatedData.sort(function (a, b) { return a._id - b._id })
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '3', today: now })
  })

  it('If a doc contains $$indexCreated, no error is thrown during treatRawData and we can get the index options', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ $$indexCreated: { fieldName: 'test', unique: true } }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const treatedData = d.persistence.treatRawData(rawData).data
    const indexes = d.persistence.treatRawData(rawData).indexes

    assert.equal(Object.keys(indexes).length, 1)
    assert.deepEqual(indexes.test, { fieldName: 'test', unique: true })

    treatedData.sort((a, b) => a._id - b._id)
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '3', today: now })
  })

  it('If a doc contains $$indexCreated, no error is thrown during treatRawData and we can get the index options (with stream)', async () => {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ $$indexCreated: { fieldName: 'test', unique: true } }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    const result = await d.persistence.treatRawStreamAsync(stream)
    const treatedData = result.data
    const indexes = result.indexes
    assert.equal(Object.keys(indexes).length, 1)
    assert.deepEqual(indexes.test, { fieldName: 'test', unique: true })

    treatedData.sort(function (a, b) { return a._id - b._id })
    assert.equal(treatedData.length, 2)
    assert.deepEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepEqual(treatedData[1], { _id: '3', today: now })
  })

  it('Compact database on load', async () => {
    await d.insertAsync({ a: 2 })
    await d.insertAsync({ a: 4 })
    await d.removeAsync({ a: 2 }, {})
    // Here, the underlying file is 3 lines long for only one document
    const data = (await fs.readFile(d.filename, 'utf8')).split('\n')
    let filledCount = 0

    data.forEach(item => { if (item.length > 0) { filledCount += 1 } })
    assert.equal(filledCount, 3)

    await d.loadDatabaseAsync()

    // Now, the file has been compacted and is only 1 line long
    const data2 = (await fs.readFile(d.filename, 'utf8')).split('\n')
    filledCount = 0

    data2.forEach(function (item) { if (item.length > 0) { filledCount += 1 } })
    assert.equal(filledCount, 1)
  })

  it('Calling loadDatabase after the data was modified doesnt change its contents', async () => {
    await d.loadDatabaseAsync()
    await d.insertAsync({ a: 1 })
    await d.insertAsync({ a: 2 })
    const data = d.getAllData()
    const doc1 = data.find(doc => doc.a === 1)
    const doc2 = data.find(doc => doc.a === 2)
    assert.equal(data.length, 2)
    assert.equal(doc1.a, 1)
    assert.equal(doc2.a, 2)

    await d.loadDatabaseAsync()
    const dataReloaded = d.getAllData()
    const doc1Reloaded = dataReloaded.find(doc => doc.a === 1)
    const doc2Reloaded = dataReloaded.find(doc => doc.a === 2)
    assert.equal(data.length, 2)
    assert.equal(doc1Reloaded.a, 1)
    assert.equal(doc2Reloaded.a, 2)
  })

  it('Calling loadDatabase after the datafile was removed will reset the database', async () => {
    await d.loadDatabaseAsync()
    await d.insertAsync({ a: 1 })
    await d.insertAsync({ a: 2 })
    const data = d.getAllData()
    const doc1 = data.find(doc => doc.a === 1)
    const doc2 = data.find(doc => doc.a === 2)
    assert.equal(data.length, 2)
    assert.equal(doc1.a, 1)
    assert.equal(doc2.a, 2)

    await fs.unlink(testDb)
    await d.loadDatabaseAsync()
    assert.equal(d.getAllData().length, 0)
  })

  it('Calling loadDatabase after the datafile was modified loads the new data', async () => {
    await d.loadDatabaseAsync()
    await d.insertAsync({ a: 1 })
    await d.insertAsync({ a: 2 })
    const data = d.getAllData()
    const doc1 = data.find(doc => doc.a === 1)
    const doc2 = data.find(doc => doc.a === 2)
    assert.equal(data.length, 2)
    assert.equal(doc1.a, 1)
    assert.equal(doc2.a, 2)

    await fs.writeFile(testDb, '{"a":3,"_id":"aaa"}', 'utf8')
    await d.loadDatabaseAsync()
    const dataReloaded = d.getAllData()
    const doc1Reloaded = dataReloaded.find(function (doc) { return doc.a === 1 })
    const doc2Reloaded = dataReloaded.find(function (doc) { return doc.a === 2 })
    const doc3Reloaded = dataReloaded.find(function (doc) { return doc.a === 3 })
    assert.equal(dataReloaded.length, 1)
    assert.equal(doc3Reloaded.a, 3)
    assert.equal(doc1Reloaded, undefined)
    assert.equal(doc2Reloaded, undefined)
  })

  it('When treating raw data, refuse to proceed if too much data is corrupt, to avoid data loss', async () => {
    const corruptTestFilename = 'workspace/corruptTest.db'
    const fakeData = '{"_id":"one","hello":"world"}\n' + 'Some corrupt data\n' + '{"_id":"two","hello":"earth"}\n' + '{"_id":"three","hello":"you"}\n'
    let d
    await fs.writeFile(corruptTestFilename, fakeData, 'utf8')

    // Default corruptAlertThreshold
    d = new Datastore({ filename: corruptTestFilename })
    await assert.rejects(() => d.loadDatabaseAsync())

    await fs.writeFile(corruptTestFilename, fakeData, 'utf8')
    d = new Datastore({ filename: corruptTestFilename, corruptAlertThreshold: 1 })
    await d.loadDatabaseAsync()
    await fs.writeFile(corruptTestFilename, fakeData, 'utf8')
    d = new Datastore({ filename: corruptTestFilename, corruptAlertThreshold: 0 })
    await assert.rejects(() => d.loadDatabaseAsync())
  })

  it('Can listen to compaction events', async () => {
    const compacted = new Promise(resolve => {
      d.once('compaction.done', function () {
        resolve()
      })
    })
    await d.persistence.compactDatafileAsync()
    await compacted // should already be resolved when the function returns, but still awaiting for it
  })

  describe('Serialization hooks', async () => {
    const as = s => `before_${s}_after`
    const bd = s => s.substring(7, s.length - 6)

    it('Declaring only one hook will throw an exception to prevent data loss', async () => {
      const hookTestFilename = 'workspace/hookTest.db'
      await storage.ensureFileDoesntExistAsync(hookTestFilename)
      await fs.writeFile(hookTestFilename, 'Some content', 'utf8')
      assert.throws(() => {
        // eslint-disable-next-line no-new
        new Datastore({
          filename: hookTestFilename,
          autoload: true,
          afterSerialization: as
        })
      })
      // Data file left untouched
      assert.equal(await fs.readFile(hookTestFilename, 'utf8'), 'Some content')
      assert.throws(() => {
        // eslint-disable-next-line no-new
        new Datastore({
          filename: hookTestFilename,
          autoload: true,
          beforeDeserialization: bd
        })
      })

      // Data file left untouched
      assert.equal(await fs.readFile(hookTestFilename, 'utf8'), 'Some content')
    })

    it('Declaring two hooks that are not reverse of one another will cause an exception to prevent data loss', async () => {
      const hookTestFilename = 'workspace/hookTest.db'
      await storage.ensureFileDoesntExistAsync(hookTestFilename)
      await fs.writeFile(hookTestFilename, 'Some content', 'utf8')
      assert.throws(() => {
        // eslint-disable-next-line no-new
        new Datastore({
          filename: hookTestFilename,
          autoload: true,
          afterSerialization: as,
          beforeDeserialization: function (s) { return s }
        })
      })

      // Data file left untouched
      assert.equal(await fs.readFile(hookTestFilename, 'utf8'), 'Some content')
    })

    it('A serialization hook can be used to transform data before writing new state to disk', async () => {
      const hookTestFilename = 'workspace/hookTest.db'
      await storage.ensureFileDoesntExistAsync(hookTestFilename)
      const d = new Datastore({
        filename: hookTestFilename,
        autoload: true,
        afterSerialization: as,
        beforeDeserialization: bd
      })

      await d.insertAsync({ hello: 'world' })
      const data = (await fs.readFile(hookTestFilename, 'utf8')).split('\n')
      let doc0 = bd(data[0])

      assert.equal(data.length, 2)

      assert.equal(data[0].substring(0, 7), 'before_')
      assert.equal(data[0].substring(data[0].length - 6), '_after')

      doc0 = model.deserialize(doc0)
      assert.equal(Object.keys(doc0).length, 2)
      assert.equal(doc0.hello, 'world')

      await d.insertAsync({ p: 'Mars' })
      const data2 = (await fs.readFile(hookTestFilename, 'utf8')).split('\n')
      doc0 = bd(data2[0])
      let doc1 = bd(data2[1])

      assert.equal(data2.length, 3)

      assert.equal(data2[0].substring(0, 7), 'before_')
      assert.equal(data2[0].substring(data2[0].length - 6), '_after')
      assert.equal(data2[1].substring(0, 7), 'before_')
      assert.equal(data2[1].substring(data2[1].length - 6), '_after')

      doc0 = model.deserialize(doc0)
      assert.equal(Object.keys(doc0).length, 2)
      assert.equal(doc0.hello, 'world')

      doc1 = model.deserialize(doc1)
      assert.equal(Object.keys(doc1).length, 2)
      assert.equal(doc1.p, 'Mars')

      await d.ensureIndexAsync({ fieldName: 'idefix' })
      const data3 = (await fs.readFile(hookTestFilename, 'utf8')).split('\n')
      doc0 = bd(data3[0])
      doc1 = bd(data3[1])
      let idx = bd(data3[2])

      assert.equal(data3.length, 4)

      assert.equal(data3[0].substring(0, 7), 'before_')
      assert.equal(data3[0].substring(data3[0].length - 6), '_after')
      assert.equal(data3[1].substring(0, 7), 'before_')
      assert.equal(data3[1].substring(data3[1].length - 6), '_after')

      doc0 = model.deserialize(doc0)
      assert.equal(Object.keys(doc0).length, 2)
      assert.equal(doc0.hello, 'world')

      doc1 = model.deserialize(doc1)
      assert.equal(Object.keys(doc1).length, 2)
      assert.equal(doc1.p, 'Mars')

      idx = model.deserialize(idx)
      assert.deepEqual(idx, { $$indexCreated: { fieldName: 'idefix' } })
    })

    it('Use serialization hook when persisting cached database or compacting', async () => {
      const hookTestFilename = 'workspace/hookTest.db'
      await storage.ensureFileDoesntExistAsync(hookTestFilename)
      const d = new Datastore({
        filename: hookTestFilename,
        autoload: true,
        afterSerialization: as,
        beforeDeserialization: bd
      })

      await d.insertAsync({ hello: 'world' })
      await d.updateAsync({ hello: 'world' }, { $set: { hello: 'earth' } }, {})
      await d.ensureIndexAsync({ fieldName: 'idefix' })
      const data = (await fs.readFile(hookTestFilename, 'utf8')).split('\n')
      let doc0 = bd(data[0])
      let doc1 = bd(data[1])
      let idx = bd(data[2])

      assert.equal(data.length, 4)

      doc0 = model.deserialize(doc0)
      assert.equal(Object.keys(doc0).length, 2)
      assert.equal(doc0.hello, 'world')

      doc1 = model.deserialize(doc1)
      assert.equal(Object.keys(doc1).length, 2)
      assert.equal(doc1.hello, 'earth')

      assert.equal(doc0._id, doc1._id)
      const _id = doc0._id

      idx = model.deserialize(idx)
      assert.deepEqual(idx, { $$indexCreated: { fieldName: 'idefix' } })

      await d.persistence.persistCachedDatabaseAsync()
      const data2 = (await fs.readFile(hookTestFilename, 'utf8')).split('\n')
      doc0 = bd(data2[0])
      idx = bd(data2[1])

      assert.equal(data2.length, 3)

      doc0 = model.deserialize(doc0)
      assert.equal(Object.keys(doc0).length, 2)
      assert.equal(doc0.hello, 'earth')

      assert.equal(doc0._id, _id)

      idx = model.deserialize(idx)
      assert.deepEqual(idx, { $$indexCreated: { fieldName: 'idefix', unique: false, sparse: false } })
    })

    it('Deserialization hook is correctly used when loading data', async () => {
      const hookTestFilename = 'workspace/hookTest.db'
      await storage.ensureFileDoesntExistAsync(hookTestFilename)
      const d = new Datastore({
        filename: hookTestFilename,
        autoload: true,
        afterSerialization: as,
        beforeDeserialization: bd
      })

      const doc = await d.insertAsync({ hello: 'world' })
      const _id = doc._id
      await d.insertAsync({ yo: 'ya' })
      await d.updateAsync({ hello: 'world' }, { $set: { hello: 'earth' } }, {})
      await d.removeAsync({ yo: 'ya' }, {})
      await d.ensureIndexAsync({ fieldName: 'idefix' })
      const data = (await fs.readFile(hookTestFilename, 'utf8')).split('\n')

      assert.equal(data.length, 6)

      // Everything is deserialized correctly, including deletes and indexes
      const d2 = new Datastore({
        filename: hookTestFilename,
        afterSerialization: as,
        beforeDeserialization: bd
      })
      await d2.loadDatabaseAsync()
      const docs = await d2.findAsync({})
      assert.equal(docs.length, 1)
      assert.equal(docs[0].hello, 'earth')
      assert.equal(docs[0]._id, _id)

      assert.equal(Object.keys(d2.indexes).length, 2)
      assert.notEqual(Object.keys(d2.indexes).indexOf('idefix'), -1)
    })
  }) // ==== End of 'Serialization hooks' ==== //

  describe('Prevent dataloss when persisting data', function () {
    it('Creating a datastore with in memory as true and a bad filename wont cause an error', () => {
      // eslint-disable-next-line no-new
      new Datastore({ filename: 'workspace/bad.db~', inMemoryOnly: true })
    })

    it('Creating a persistent datastore with a bad filename will cause an error', function () {
      assert.throws(() => {
        // eslint-disable-next-line no-new
        new Datastore({ filename: 'workspace/bad.db~' })
      })
    })

    it('If no file stat, ensureDatafileIntegrity creates an empty datafile', async () => {
      const p = new Persistence({ db: { inMemoryOnly: false, filename: 'workspace/it.db' } })
      if (await exists('workspace/it.db')) await fs.unlink('workspace/it.db')
      if (await exists('workspace/it.db~')) await fs.unlink('workspace/it.db~')

      assert.equal(await exists('workspace/it.db'), false)
      assert.equal(await exists('workspace/it.db~'), false)

      await storage.ensureDatafileIntegrityAsync(p.filename)

      assert.equal(await exists('workspace/it.db'), true)
      assert.equal(await exists('workspace/it.db~'), false)

      assert.equal(await fs.readFile('workspace/it.db', 'utf8'), '')
    })

    it('If only datafile stat, ensureDatafileIntegrity will use it', async () => {
      const p = new Persistence({ db: { inMemoryOnly: false, filename: 'workspace/it.db' } })

      if (await exists('workspace/it.db')) { await fs.unlink('workspace/it.db') }
      if (await exists('workspace/it.db~')) { await fs.unlink('workspace/it.db~') }

      await fs.writeFile('workspace/it.db', 'something', 'utf8')

      assert.equal(await exists('workspace/it.db'), true)
      assert.equal(await exists('workspace/it.db~'), false)

      await storage.ensureDatafileIntegrityAsync(p.filename)

      assert.equal(await exists('workspace/it.db'), true)
      assert.equal(await exists('workspace/it.db~'), false)

      assert.equal(await fs.readFile('workspace/it.db', 'utf8'), 'something')
    })

    it('If temp datafile stat and datafile doesnt, ensureDatafileIntegrity will use it (cannot happen except upon first use)', async () => {
      const p = new Persistence({ db: { inMemoryOnly: false, filename: 'workspace/it.db' } })

      if (await exists('workspace/it.db')) { await fs.unlink('workspace/it.db') }
      if (await exists('workspace/it.db~')) { await fs.unlink('workspace/it.db~~') }

      await fs.writeFile('workspace/it.db~', 'something', 'utf8')

      assert.equal(await exists('workspace/it.db'), false)
      assert.equal(await exists('workspace/it.db~'), true)

      await storage.ensureDatafileIntegrityAsync(p.filename)

      assert.equal(await exists('workspace/it.db'), true)
      assert.equal(await exists('workspace/it.db~'), false)

      assert.equal(await fs.readFile('workspace/it.db', 'utf8'), 'something')
    })

    // Technically it could also mean the write was successful but the rename wasn't, but there is in any case no guarantee that the data in the temp file is whole so we have to discard the whole file
    it('If both temp and current datafiles exist, ensureDatafileIntegrity will use the datafile, as it means that the write of the temp file failed', async () => {
      const theDb = new Datastore({ filename: 'workspace/it.db' })

      if (await exists('workspace/it.db')) { await fs.unlink('workspace/it.db') }
      if (await exists('workspace/it.db~')) { await fs.unlink('workspace/it.db~') }

      await fs.writeFile('workspace/it.db', '{"_id":"0","hello":"world"}', 'utf8')
      await fs.writeFile('workspace/it.db~', '{"_id":"0","hello":"other"}', 'utf8')

      assert.equal(await exists('workspace/it.db'), true)
      assert.equal(await exists('workspace/it.db~'), true)

      await storage.ensureDatafileIntegrityAsync(theDb.persistence.filename)

      assert.equal(await exists('workspace/it.db'), true)
      assert.equal(await exists('workspace/it.db~'), true)

      assert.equal(await fs.readFile('workspace/it.db', 'utf8'), '{"_id":"0","hello":"world"}')

      await theDb.loadDatabaseAsync()
      const docs = await theDb.findAsync({})
      assert.equal(docs.length, 1)
      assert.equal(docs[0].hello, 'world')
      assert.equal(await exists('workspace/it.db'), true)
      assert.equal(await exists('workspace/it.db~'), false)
    })

    it('persistCachedDatabase should update the contents of the datafile and leave a clean state', async () => {
      await d.insertAsync({ hello: 'world' })
      const docs = await d.findAsync({})
      assert.equal(docs.length, 1)

      if (await exists(testDb)) { await fs.unlink(testDb) }
      if (await exists(testDb + '~')) { await fs.unlink(testDb + '~') }
      assert.equal(await exists(testDb), false)

      await fs.writeFile(testDb + '~', 'something', 'utf8')
      assert.equal(await exists(testDb + '~'), true)

      await d.persistence.persistCachedDatabaseAsync()
      const contents = await fs.readFile(testDb, 'utf8')
      assert.equal(await exists(testDb), true)
      assert.equal(await exists(testDb + '~'), false)
      if (!contents.match(/^{"hello":"world","_id":"[0-9a-zA-Z]{16}"}\n$/)) {
        throw new Error('Datafile contents not as expected')
      }
    })

    it('After a persistCachedDatabase, there should be no temp or old filename', async () => {
      await d.insertAsync({ hello: 'world' })
      const docs = await d.findAsync({})
      assert.equal(docs.length, 1)

      if (await exists(testDb)) { await fs.unlink(testDb) }
      if (await exists(testDb + '~')) { await fs.unlink(testDb + '~') }
      assert.equal(await exists(testDb), false)
      assert.equal(await exists(testDb + '~'), false)

      await fs.writeFile(testDb + '~', 'bloup', 'utf8')
      assert.equal(await exists(testDb + '~'), true)

      await d.persistence.persistCachedDatabaseAsync()
      const contents = await fs.readFile(testDb, 'utf8')
      assert.equal(await exists(testDb), true)
      assert.equal(await exists(testDb + '~'), false)
      if (!contents.match(/^{"hello":"world","_id":"[0-9a-zA-Z]{16}"}\n$/)) {
        throw new Error('Datafile contents not as expected')
      }
    })

    it('persistCachedDatabase should update the contents of the datafile and leave a clean state even if there is a temp datafile', async () => {
      await d.insertAsync({ hello: 'world' })
      const docs = await d.find({})
      assert.equal(docs.length, 1)

      if (await exists(testDb)) { await fs.unlink(testDb) }
      await fs.writeFile(testDb + '~', 'blabla', 'utf8')
      assert.equal(await exists(testDb), false)
      assert.equal(await exists(testDb + '~'), true)

      await d.persistence.persistCachedDatabaseAsync()
      const contents = await fs.readFile(testDb, 'utf8')
      assert.equal(await exists(testDb), true)
      assert.equal(await exists(testDb + '~'), false)
      if (!contents.match(/^{"hello":"world","_id":"[0-9a-zA-Z]{16}"}\n$/)) {
        throw new Error('Datafile contents not as expected')
      }
    })

    it('persistCachedDatabase should update the contents of the datafile and leave a clean state even if there is a temp datafile', async () => {
      const dbFile = 'workspace/test2.db'

      if (await exists(dbFile)) { await fs.unlink(dbFile) }
      if (await exists(dbFile + '~')) { await fs.unlink(dbFile + '~') }

      const theDb = new Datastore({ filename: dbFile })

      await theDb.loadDatabaseAsync()
      const contents = await fs.readFile(dbFile, 'utf8')
      assert.equal(await exists(dbFile), true)
      assert.equal(await exists(dbFile + '~'), false)
      if (contents !== '') {
        throw new Error('Datafile contents not as expected')
      }
    })

    it('Persistence works as expected when everything goes fine', async () => {
      const dbFile = 'workspace/test2.db'

      await storage.ensureFileDoesntExistAsync(dbFile)
      await storage.ensureFileDoesntExistAsync(dbFile + '~')

      const theDb = new Datastore({ filename: dbFile })
      await theDb.loadDatabaseAsync()
      const docs = await theDb.find({})
      assert.equal(docs.length, 0)

      const doc1 = await theDb.insertAsync({ a: 'hello' })
      const doc2 = await theDb.insertAsync({ a: 'world' })

      const docs2 = await theDb.findAsync({})
      assert.equal(docs2.length, 2)
      assert.equal(docs2.find(item => item._id === doc1._id).a, 'hello')
      assert.equal(docs2.find(item => item._id === doc2._id).a, 'world')

      await theDb.loadDatabaseAsync()

      const docs3 = await theDb.findAsync({})
      assert.equal(docs3.length, 2)
      assert.equal(docs3.find(item => item._id === doc1._id).a, 'hello')
      assert.equal(docs3.find(item => item._id === doc2._id).a, 'world')
      assert.equal(await exists(dbFile), true)
      assert.equal(await exists(dbFile + '~'), false)

      const theDb2 = new Datastore({ filename: dbFile })
      await theDb2.loadDatabaseAsync()
      // No change in second db
      const docs4 = await theDb2.findAsync({})
      assert.equal(docs4.length, 2)
      assert.equal(docs4.find(item => item._id === doc1._id).a, 'hello')
      assert.equal(docs4.find(item => item._id === doc2._id).a, 'world')

      assert.equal(await exists(dbFile), true)
      assert.equal(await exists(dbFile + '~'), false)
    })

    // The child process will load the database with the given datafile, but the fs.writeFile function
    // is rewritten to crash the process before it finished (after 5000 bytes), to ensure data was not lost
    it('If system crashes during a loadDatabase, the former version is not lost', async () => {
      const N = 500
      let toWrite = ''
      let i
      let docI

      // Ensuring the state is clean
      if (await exists('workspace/lac.db')) { await fs.unlink('workspace/lac.db') }
      if (await exists('workspace/lac.db~')) { await fs.unlink('workspace/lac.db~') }

      // Creating a db file with 150k records (a bit long to load)
      for (i = 0; i < N; i += 1) {
        toWrite += model.serialize({ _id: 'anid_' + i, hello: 'world' }) + '\n'
      }
      await fs.writeFile('workspace/lac.db', toWrite, 'utf8')

      const datafileLength = (await fs.readFile('workspace/lac.db', 'utf8')).length

      // Loading it in a separate process that we will crash before finishing the loadDatabase
      fork('test_lac/loadAndCrash.test').on('exit', async function (code) {
        assert.equal(code, 1) // See test_lac/loadAndCrash.test.js

        assert.equal(await exists('workspace/lac.db'), true)
        assert.equal(await exists('workspace/lac.db~'), true)
        assert.equal((await fs.readFile('workspace/lac.db', 'utf8')).length, datafileLength)
        assert.equal((await fs.readFile('workspace/lac.db~', 'utf8')).length, 5000)

        // Reload database without a crash, check that no data was lost and fs state is clean (no temp file)
        const db = new Datastore({ filename: 'workspace/lac.db' })
        await db.loadDatabaseAsync()
        assert.equal(await exists('workspace/lac.db'), true)
        assert.equal(await exists('workspace/lac.db~'), false)
        assert.equal((await fs.readFile('workspace/lac.db', 'utf8')).length, datafileLength)

        const docs = await db.findAsync({})
        assert.equal(docs.length, N)
        for (i = 0; i < N; i += 1) {
          docI = docs.find(d => d._id === 'anid_' + i)
          assert.notEqual(docI, undefined)
          assert.deepEqual({ hello: 'world', _id: 'anid_' + i }, docI)
        }
      })

      // Not run on Windows as there is no clean way to set maximum file descriptors. Not an issue as the code itself is tested.
      it('Cannot cause EMFILE errors by opening too many file descriptors', async function () {
        this.timeout(5000)
        if (process.platform === 'win32' || process.platform === 'win64') { return }
        const { stdout } = await promisify(execFile)('test_lac/openFdsLaunch.sh')
        // The subprocess will not output anything to stdout unless part of the test fails
        if (stdout.length !== 0) throw new Error(stdout)
      })
    })
  }) // ==== End of 'Prevent dataloss when persisting data' ====

  describe('ensureFileDoesntExist', function () {
    it('Doesnt do anything if file already doesnt exist', async () => {
      await storage.ensureFileDoesntExistAsync('workspace/nonexisting')
      assert.equal(await exists('workspace/nonexisting'), false)
    })

    it('Deletes file if it stat', async () => {
      await fs.writeFile('workspace/existing', 'hello world', 'utf8')
      assert.equal(await exists('workspace/existing'), true)

      await storage.ensureFileDoesntExistAsync('workspace/existing')
      assert.equal(await exists('workspace/existing'), false)
    })
  }) // ==== End of 'ensureFileDoesntExist' ====
})
