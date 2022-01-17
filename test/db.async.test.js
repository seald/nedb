/* eslint-env mocha */
const testDb = 'workspace/test.db'
const { promises: fs } = require('fs')
const path = require('path')
const assert = require('assert').strict
const model = require('../lib/model')
const Datastore = require('../lib/datastore')
const Persistence = require('../lib/persistence')
const { wait } = require('./utils.test')
const { exists } = require('./utils.test.js')
const reloadTimeUpperBound = 60 // In ms, an upper bound for the reload time used to check createdAt and updatedAt

describe('Database async', function () {
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

  it('Constructor compatibility with v0.6-', () => {
    const db1 = new Datastore('somefile')
    assert.equal(db1.filename, 'somefile')
    assert.equal(db1.inMemoryOnly, false)

    const db2 = new Datastore('')
    assert.equal(db2.filename, null)
    assert.equal(db2.inMemoryOnly, true)

    const db3 = new Datastore()
    assert.equal(db3.filename, null)
    assert.equal(db3.inMemoryOnly, true)
  })

  describe('Autoloading', () => {
    it('Can autoload a database and query it right away', async () => {
      const fileStr = model.serialize({
        _id: '1',
        a: 5,
        planet: 'Earth'
      }) + '\n' + model.serialize({
        _id: '2',
        a: 5,
        planet: 'Mars'
      }) + '\n'
      const autoDb = 'workspace/auto.db'

      await fs.writeFile(autoDb, fileStr, 'utf8')
      const db = new Datastore({ filename: autoDb, autoload: true })

      const docs = await db.findAsync({})
      assert.equal(docs.length, 2)
    })

    it('Throws if autoload fails', async () => {
      const fileStr = model.serialize({
        _id: '1',
        a: 5,
        planet: 'Earth'
      }) + '\n' + model.serialize({
        _id: '2',
        a: 5,
        planet: 'Mars'
      }) + '\n' + '{"$$indexCreated":{"fieldName":"a","unique":true}}'
      const autoDb = 'workspace/auto.db'

      await fs.writeFile(autoDb, fileStr, 'utf8')

      const db = new Datastore({ filename: autoDb, autoload: true })
      await Promise.race([
        // Check the loadDatabase generated an error
        assert.rejects(() => db.autoloadPromise, err => {
          assert.equal(err.errorType, 'uniqueViolated')
          return true
        }),
        db.findAsync({}).finally(() => { throw new Error('Find should not be executed since autoload failed') })
      ])
    })
  })

  describe('Insert', () => {
    it('Able to insert a document in the database, setting an _id if none provided, and retrieve it even after a reload', async () => {
      const docsEmpty = await d.findAsync({})
      assert.equal(docsEmpty.length, 0)
      await d.insertAsync({ somedata: 'ok' })
      const docs = await d.findAsync({})
      // The data was correctly updated
      assert.equal(docs.length, 1)
      assert.equal(Object.keys(docs[0]).length, 2)
      assert.equal(docs[0].somedata, 'ok')
      assert.notEqual(docs[0]._id, undefined)
      // After a reload the data has been correctly persisted
      await d.loadDatabaseAsync()
      const docsReloaded = await d.findAsync({})
      assert.equal(docsReloaded.length, 1)
      assert.equal(Object.keys(docsReloaded[0]).length, 2)
      assert.equal(docsReloaded[0].somedata, 'ok')
      assert.notEqual(docsReloaded[0]._id, undefined)
    })

    it('Can insert multiple documents in the database', async () => {
      const docsEmpty = await d.findAsync({})
      assert.equal(docsEmpty.length, 0)
      await d.insertAsync({ somedata: 'ok' })
      await d.insertAsync({ somedata: 'another' })
      await d.insertAsync({ somedata: 'again' })
      const docs = await d.findAsync({})
      assert.equal(docs.length, 3)
      const values = docs.map(x => x.somedata)
      assert.ok(values.includes('ok'))
      assert.ok(values.includes('another'))
      assert.ok(values.includes('again'))
    })

    it('Can insert and get back from DB complex objects with all primitive and secondary types', async () => {
      const da = new Date()
      const obj = { a: ['ee', 'ff', 42], date: da, subobj: { a: 'b', b: 'c' } }
      await d.insertAsync(obj)
      const res = await d.findOneAsync({})
      assert.deepEqual(res.a, obj.a)
      assert.equal(res.date.getTime(), da.getTime())
      assert.deepEqual(res.subobj, obj.subobj)
    })

    it('If an object returned from the DB is modified and refetched, the original value should be found', async () => {
      await d.insertAsync({ a: 'something' })
      const doc = await d.findOneAsync({})
      assert.equal(doc.a, 'something')
      doc.a = 'another thing'
      assert.equal(doc.a, 'another thing')
      // Re-fetching with findOne should yield the persisted value
      const doc2 = await d.findOneAsync({})
      assert.equal(doc2.a, 'something')
      doc2.a = 'another thing'
      assert.equal(doc2.a, 'another thing')
      const docs = await d.findAsync({})
      assert.equal(docs[0].a, 'something')
    })

    it('Cannot insert a doc that has a field beginning with a $ sign', async () => {
      await assert.rejects(() => d.insertAsync({ $something: 'atest' }))
    })

    it('If an _id is already given when we insert a document, use that instead of generating a random one', async () => {
      const newDoc = await d.insertAsync({ _id: 'test', stuff: true })
      assert.equal(newDoc.stuff, true)
      assert.equal(newDoc._id, 'test')

      await assert.rejects(() => d.insertAsync({
        _id: 'test',
        otherstuff: 42
      }), err => {
        assert.equal(err.errorType, 'uniqueViolated')
        return true
      })
    })

    it('Modifying the insertedDoc after an insert doesnt change the copy saved in the database', async () => {
      const newDoc = await d.insertAsync({ a: 2, hello: 'world' })
      newDoc.hello = 'changed'
      const doc = await d.findOneAsync({ a: 2 })
      assert.equal(doc.hello, 'world')
    })

    it('Can insert an array of documents at once', async () => {
      const docsToInsert = [{ a: 5, b: 'hello' }, { a: 42, b: 'world' }]
      await d.insertAsync(docsToInsert)
      const docs = await d.findAsync({})
      assert.equal(docs.find(doc => doc.a === 5).b, 'hello')
      assert.equal(docs.find(doc => doc.a === 42).b, 'world')
      assert.equal(docs.length, 2)
      const data = (await fs.readFile(testDb, 'utf8'))
        .split('\n')
        .filter(line => line.length > 0)
      assert.equal(data.length, 2)
      assert.equal(model.deserialize(data[0]).a, 5)
      assert.equal(model.deserialize(data[0]).b, 'hello')
      assert.equal(model.deserialize(data[1]).a, 42)
      assert.equal(model.deserialize(data[1]).b, 'world')
    })

    it('If a bulk insert violates a constraint, all changes are rolled back', async () => {
      const docsToInsert = [{ a: 5, b: 'hello' }, { a: 42, b: 'world' }, { a: 5, b: 'bloup' }, { a: 7 }]
      // Important to await here to make sure filesystem synced
      await d.ensureIndexAsync({ fieldName: 'a', unique: true })
      await assert.rejects(() => d.insertAsync(docsToInsert), err => {
        assert.equal(err.errorType, 'uniqueViolated')
        return true
      })
      const docs = await d.findAsync({})
      // Datafile only contains index definition
      const datafileContents = model.deserialize(await fs.readFile(testDb, 'utf8'))
      assert.deepEqual(datafileContents, { $$indexCreated: { fieldName: 'a', unique: true } })
      assert.equal(docs.length, 0)
    })

    it('If timestampData option is set, a createdAt field is added and persisted', async () => {
      const newDoc = { hello: 'world' }
      const beginning = Date.now()
      d = new Datastore({ filename: testDb, timestampData: true, autoload: true })
      const docsEmpty = await d.findAsync({})
      assert.equal(docsEmpty.length, 0)
      const insertedDoc = await d.insertAsync(newDoc)
      // No side effect on given input
      assert.deepEqual(newDoc, { hello: 'world' })
      // Insert doc has two new fields, _id and createdAt
      assert.equal(insertedDoc.hello, 'world')
      assert.notEqual(insertedDoc.createdAt, undefined)
      assert.notEqual(insertedDoc.updatedAt, undefined)
      assert.equal(insertedDoc.createdAt, insertedDoc.updatedAt)
      assert.notEqual(insertedDoc._id, undefined)
      assert.equal(Object.keys(insertedDoc).length, 4)
      assert.ok(Math.abs(insertedDoc.createdAt.getTime() - beginning) < reloadTimeUpperBound) // No more than 30ms should have elapsed (worst case, if there is a flush)

      // Modifying results of insert doesn't change the cache
      insertedDoc.bloup = 'another'
      assert.equal(Object.keys(insertedDoc).length, 5)

      const docs = await d.findAsync({})
      assert.equal(docs.length, 1)
      // No side effect on given input
      assert.deepEqual(newDoc, { hello: 'world' })
      assert.deepEqual({
        hello: 'world',
        _id: insertedDoc._id,
        createdAt: insertedDoc.createdAt,
        updatedAt: insertedDoc.updatedAt
      }, docs[0])

      // All data correctly persisted on disk
      await d.loadDatabaseAsync()
      const docsReloaded = await d.findAsync({})
      assert.equal(docsReloaded.length, 1)
      // No side effect on given input
      assert.deepEqual(newDoc, { hello: 'world' })
      assert.deepEqual({
        hello: 'world',
        _id: insertedDoc._id,
        createdAt: insertedDoc.createdAt,
        updatedAt: insertedDoc.updatedAt
      }, docsReloaded[0])
    })

    it('If timestampData option not set, don\'t create a createdAt and a updatedAt field', async () => {
      const insertedDoc = await d.insertAsync({ hello: 'world' })
      assert.equal(Object.keys(insertedDoc).length, 2)
      assert.equal(insertedDoc.createdAt, undefined)
      assert.equal(insertedDoc.updatedAt, undefined)
      const docs = await d.findAsync({})
      assert.equal(docs.length, 1)
      assert.deepEqual(docs[0], insertedDoc)
    })

    it('If timestampData is set but createdAt is specified by user, don\'t change it', async () => {
      const newDoc = { hello: 'world', createdAt: new Date(234) }
      const beginning = Date.now()
      d = new Datastore({ filename: testDb, timestampData: true, autoload: true })
      const insertedDoc = await d.insertAsync(newDoc)
      assert.equal(Object.keys(insertedDoc).length, 4)
      assert.equal(insertedDoc.createdAt.getTime(), 234) // Not modified
      assert.ok(insertedDoc.updatedAt.getTime() - beginning < reloadTimeUpperBound) // Created
      const docs = await d.findAsync({})
      assert.deepEqual(insertedDoc, docs[0])
      await d.loadDatabaseAsync()
      const docsReloaded = await d.findAsync({})
      assert.deepEqual(insertedDoc, docsReloaded[0])
    })

    it('If timestampData is set but updatedAt is specified by user, don\'t change it', async () => {
      const newDoc = { hello: 'world', updatedAt: new Date(234) }
      const beginning = Date.now()
      d = new Datastore({ filename: testDb, timestampData: true, autoload: true })
      const insertedDoc = await d.insertAsync(newDoc)
      assert.equal(Object.keys(insertedDoc).length, 4)
      assert.equal(insertedDoc.updatedAt.getTime(), 234)
      assert.ok(insertedDoc.createdAt.getTime() - beginning < reloadTimeUpperBound)
      const docs = await d.findAsync({})
      assert.deepEqual(insertedDoc, docs[0])
      await d.loadDatabaseAsync()
      const docsReloaded = await d.findAsync({})
      assert.deepEqual(insertedDoc, docsReloaded[0])
    })

    it('Can insert a doc with id 0', async () => {
      const doc = await d.insertAsync({ _id: 0, hello: 'world' })
      assert.equal(doc._id, 0)
      assert.equal(doc.hello, 'world')
    })
  }) // ==== End of 'Insert' ==== //

  describe('#getCandidates', function () {
    it('Can use an index to get docs with a basic match', async () => {
      await d.ensureIndexAsync({ fieldName: 'tf' })
      const _doc1 = await d.insertAsync({ tf: 4 })
      await d.insertAsync({ tf: 6 })
      const _doc2 = await d.insertAsync({ tf: 4, an: 'other' })
      await d.insertAsync({ tf: 9 })
      const data = await d._getCandidatesAsync({ r: 6, tf: 4 })
      const doc1 = data.find(d => d._id === _doc1._id)
      const doc2 = data.find(d => d._id === _doc2._id)

      assert.equal(data.length, 2)
      assert.deepEqual(doc1, { _id: doc1._id, tf: 4 })
      assert.deepEqual(doc2, { _id: doc2._id, tf: 4, an: 'other' })
    })

    it('Can use an index to get docs with a $in match', async () => {
      await d.ensureIndexAsync({ fieldName: 'tf' })
      await d.insertAsync({ tf: 4 })
      const _doc1 = await d.insertAsync({ tf: 6 })
      await d.insertAsync({ tf: 4, an: 'other' })
      const _doc2 = await d.insertAsync({ tf: 9 })
      const data = await d._getCandidatesAsync({ r: 6, tf: { $in: [6, 9, 5] } })
      const doc1 = data.find(d => d._id === _doc1._id)
      const doc2 = data.find(d => d._id === _doc2._id)

      assert.equal(data.length, 2)
      assert.deepEqual(doc1, { _id: doc1._id, tf: 6 })
      assert.deepEqual(doc2, { _id: doc2._id, tf: 9 })
    })

    it('If no index can be used, return the whole database', async () => {
      await d.ensureIndexAsync({ fieldName: 'tf' })
      const _doc1 = await d.insertAsync({ tf: 4 })
      const _doc2 = await d.insertAsync({ tf: 6 })
      const _doc3 = await d.insertAsync({ tf: 4, an: 'other' })
      const _doc4 = await d.insertAsync({ tf: 9 })
      const data = await d._getCandidatesAsync({ r: 6, notf: { $in: [6, 9, 5] } })
      const doc1 = data.find(d => d._id === _doc1._id)
      const doc2 = data.find(d => d._id === _doc2._id)
      const doc3 = data.find(d => d._id === _doc3._id)
      const doc4 = data.find(d => d._id === _doc4._id)

      assert.equal(data.length, 4)
      assert.deepEqual(doc1, { _id: doc1._id, tf: 4 })
      assert.deepEqual(doc2, { _id: doc2._id, tf: 6 })
      assert.deepEqual(doc3, { _id: doc3._id, tf: 4, an: 'other' })
      assert.deepEqual(doc4, { _id: doc4._id, tf: 9 })
    })

    it('Can use indexes for comparison matches', async () => {
      await d.ensureIndexAsync({ fieldName: 'tf' })
      await d.insertAsync({ tf: 4 })
      const _doc2 = await d.insertAsync({ tf: 6 })
      await d.insertAsync({ tf: 4, an: 'other' })
      const _doc4 = await d.insertAsync({ tf: 9 })
      const data = await d._getCandidatesAsync({ r: 6, tf: { $lte: 9, $gte: 6 } })
      const doc2 = data.find(d => d._id === _doc2._id)
      const doc4 = data.find(d => d._id === _doc4._id)

      assert.equal(data.length, 2)
      assert.deepEqual(doc2, { _id: doc2._id, tf: 6 })
      assert.deepEqual(doc4, { _id: doc4._id, tf: 9 })
    })

    it('Can set a TTL index that expires documents', async () => {
      await d.ensureIndexAsync({ fieldName: 'exp', expireAfterSeconds: 0.2 })
      await d.insertAsync({ hello: 'world', exp: new Date() })
      await wait(100)
      const doc1 = await d.findOneAsync({})
      assert.equal(doc1.hello, 'world')

      await wait(101)
      const doc2 = await d.findOneAsync({})
      assert.equal(doc2, null)
      await d.compactDatafileAsync()
      // After compaction, no more mention of the document, correctly removed
      const datafileContents = await fs.readFile(testDb, 'utf8')
      assert.equal(datafileContents.split('\n').length, 2)
      assert.doesNotMatch(datafileContents, /world/)

      // New datastore on same datafile is empty
      const d2 = new Datastore({ filename: testDb, autoload: true })
      const doc3 = await d2.findOneAsync({})
      assert.equal(doc3, null)
    })

    it('TTL indexes can expire multiple documents and only what needs to be expired', async () => {
      await d.ensureIndexAsync({ fieldName: 'exp', expireAfterSeconds: 0.2 })
      await d.insertAsync({ hello: 'world1', exp: new Date() })
      await d.insertAsync({ hello: 'world2', exp: new Date() })
      await d.insertAsync({ hello: 'world3', exp: new Date((new Date()).getTime() + 100) })
      await wait(100)
      const docs1 = await d.findAsync({})
      assert.equal(docs1.length, 3)

      await wait(101)
      const docs2 = await d.findAsync({})
      assert.equal(docs2.length, 1)
      assert.equal(docs2[0].hello, 'world3')

      await wait(101)
      const docs3 = await d.findAsync({})
      assert.equal(docs3.length, 0)
    })

    it('Document where indexed field is absent or not a date are ignored', async () => {
      await d.ensureIndexAsync({ fieldName: 'exp', expireAfterSeconds: 0.2 })
      await d.insertAsync({ hello: 'world1', exp: new Date() })
      await d.insertAsync({ hello: 'world2', exp: 'not a date' })
      await d.insertAsync({ hello: 'world3' })
      await wait(101)
      const docs1 = await d.findAsync({})
      assert.equal(docs1.length, 3)

      await wait(101)
      const docs2 = await d.findAsync({})
      assert.equal(docs2.length, 2)

      docs2[0].hello.should.not.equal('world1')
      docs2[1].hello.should.not.equal('world1')
    })
  }) // ==== End of '#getCandidates' ==== //

  describe('Find', function () {
    it('Can find all documents if an empty query is used', async () => {
      await d.insertAsync({ somedata: 'ok' })
      await d.insertAsync({ somedata: 'another', plus: 'additional data' })
      await d.insertAsync({ somedata: 'again' })
      const docs = await d.findAsync({})
      assert.equal(docs.length, 3)
      assert.ok(docs.map(x => x.somedata).includes('ok'))
      assert.ok(docs.map(x => x.somedata).includes('another'))
      assert.ok(docs.map(x => x.somedata).includes('again'))
      assert.equal(docs.find(d => d.somedata === 'another').plus, 'additional data')
    })

    it('Can find all documents matching a basic query', async () => {
      await d.insertAsync({ somedata: 'ok' })
      await d.insertAsync({ somedata: 'again', plus: 'additional data' })
      await d.insertAsync({ somedata: 'again' })
      // Test with query that will return docs
      const docs = await d.findAsync({ somedata: 'again' })
      assert.equal(docs.length, 2)
      assert.ok(!docs.map(x => x.somedata).includes('ok'))
      // Test with query that doesn't match anything
      const docs2 = await d.findAsync({ somedata: 'nope' })
      assert.equal(docs2.length, 0)
    })

    it('Can find one document matching a basic query and return null if none is found', async () => {
      await d.insertAsync({ somedata: 'ok' })
      await d.insertAsync({ somedata: 'again', plus: 'additional data' })
      await d.insertAsync({ somedata: 'again' })
      // Test with query that will return docs
      const doc = await d.findOneAsync({ somedata: 'ok' })
      assert.equal(Object.keys(doc).length, 2)
      assert.equal(doc.somedata, 'ok')
      assert.notEqual(doc._id, undefined)
      // Test with query that doesn't match anything
      const doc2 = await d.findOneAsync({ somedata: 'nope' })
      assert.equal(doc2, null)
    })

    it('Can find dates and objects (non JS-native types)', async () => {
      const date1 = new Date(1234543)
      const date2 = new Date(9999)

      await d.insertAsync({ now: date1, sth: { name: 'nedb' } })
      const doc1 = await d.findOneAsync({ now: date1 })
      assert.equal(doc1.sth.name, 'nedb')

      const doc2 = await d.findOneAsync({ now: date2 })
      assert.equal(doc2, null)

      const doc3 = await d.findOneAsync({ sth: { name: 'nedb' } })
      assert.equal(doc3.sth.name, 'nedb')

      const doc4 = await d.findOneAsync({ sth: { name: 'other' } })
      assert.equal(doc4, null)
    })

    it('Can use dot-notation to query subfields', async () => {
      await d.insertAsync({ greeting: { english: 'hello' } })
      const doc1 = await d.findOneAsync({ 'greeting.english': 'hello' })
      assert.equal(doc1.greeting.english, 'hello')

      const doc2 = await d.findOneAsync({ 'greeting.english': 'hellooo' })
      assert.equal(doc2, null)

      const doc3 = await d.findOneAsync({ 'greeting.englis': 'hello' })
      assert.equal(doc3, null)
    })

    it('Array fields match if any element matches', async () => {
      const doc1 = await d.insertAsync({ fruits: ['pear', 'apple', 'banana'] })
      const doc2 = await d.insertAsync({ fruits: ['coconut', 'orange', 'pear'] })
      const doc3 = await d.insertAsync({ fruits: ['banana'] })
      const docs = await d.findAsync({ fruits: 'pear' })
      assert.equal(docs.length, 2)
      assert.ok(docs.map(x => x._id).includes(doc1._id))
      assert.ok(docs.map(x => x._id).includes(doc2._id))

      const docs2 = await d.findAsync({ fruits: 'banana' })
      assert.equal(docs2.length, 2)
      assert.ok(docs2.map(x => x._id).includes(doc1._id))
      assert.ok(docs2.map(x => x._id).includes(doc3._id))

      const docs3 = await d.findAsync({ fruits: 'doesntexist' })
      assert.equal(docs3.length, 0)
    })

    it('Returns an error if the query is not well formed', async () => {
      await d.insertAsync({ hello: 'world' })
      await assert.rejects(() => d.findAsync({ $or: { hello: 'world' } }))
      await assert.rejects(() => d.findOneAsync({ $or: { hello: 'world' } }))
    })

    it('Changing the documents returned by find or findOne do not change the database state', async () => {
      await d.insertAsync({ a: 2, hello: 'world' })
      const doc1 = await d.findOneAsync({ a: 2 })
      doc1.hello = 'changed'

      const doc2 = await d.findOneAsync({ a: 2 })
      assert.equal(doc2.hello, 'world')

      const docs = await d.findAsync({ a: 2 })
      docs[0].hello = 'changed'

      const doc3 = await d.findOneAsync({ a: 2 })
      assert.equal(doc3.hello, 'world')
    })

    it('Can use sort, skip and limit if the callback is not passed to find but to exec', async () => {
      await d.insertAsync({ a: 2, hello: 'world' })
      await d.insertAsync({ a: 24, hello: 'earth' })
      await d.insertAsync({ a: 13, hello: 'blueplanet' })
      await d.insertAsync({ a: 15, hello: 'home' })
      const docs = await d.findAsync({}).sort({ a: 1 }).limit(2)
      assert.equal(docs.length, 2)
      assert.equal(docs[0].hello, 'world')
      assert.equal(docs[1].hello, 'blueplanet')
    })

    it('Can use sort and skip if the callback is not passed to findOne but to exec', async () => {
      await d.insertAsync({ a: 2, hello: 'world' })
      await d.insertAsync({ a: 24, hello: 'earth' })
      await d.insertAsync({ a: 13, hello: 'blueplanet' })
      await d.insertAsync({ a: 15, hello: 'home' })
      // No skip no query
      const doc1 = await d.findOneAsync({}).sort({ a: 1 })
      assert.equal(doc1.hello, 'world')

      // A query
      const doc2 = await d.findOneAsync({ a: { $gt: 14 } }).sort({ a: 1 })
      assert.equal(doc2.hello, 'home')

      // And a skip
      const doc3 = await d.findOneAsync({ a: { $gt: 14 } }).sort({ a: 1 }).skip(1)
      assert.equal(doc3.hello, 'earth')

      // No result
      const doc4 = await d.findOneAsync({ a: { $gt: 14 } }).sort({ a: 1 }).skip(2)
      assert.equal(doc4, null)
    })

    it('Can use projections in find, normal or cursor way', async () => {
      await d.insertAsync({ a: 2, hello: 'world' })
      await d.insertAsync({ a: 24, hello: 'earth' })
      const docs = await d.findAsync({ a: 2 }, { a: 0, _id: 0 })
      assert.equal(docs.length, 1)
      assert.deepEqual(docs[0], { hello: 'world' })

      const docs1 = await d.findAsync({ a: 2 }, { a: 0, _id: 0 }).execAsync()
      assert.equal(docs1.length, 1)
      assert.deepEqual(docs1[0], { hello: 'world' })

      // Can't use both modes at once if not _id
      await assert.rejects(() => d.findAsync({ a: 2 }, { a: 0, hello: 1 }))
      await assert.rejects(() => d.findAsync({ a: 2 }, { a: 0, hello: 1 }).execAsync())
    })

    it('Can use projections in findOne, normal or cursor way', async () => {
      await d.insertAsync({ a: 2, hello: 'world' })
      await d.insertAsync({ a: 24, hello: 'earth' })
      const doc1 = await d.findOneAsync({ a: 2 }, { a: 0, _id: 0 })
      assert.deepEqual(doc1, { hello: 'world' })

      const doc2 = await d.findOneAsync({ a: 2 }, { a: 0, _id: 0 })
      assert.deepEqual(doc2, { hello: 'world' })

      // Can't use both modes at once if not _id
      await assert.rejects(() => d.findOneAsync({ a: 2 }, { a: 0, hello: 1 }))
      await assert.rejects(() => d.findOneAsync({ a: 2 }, { a: 0, hello: 1 }).execAsync())
    }) // ==== End of 'Find' ==== //
  })

  describe('Count', function () {
    it('Count all documents if an empty query is used', async () => {
      await d.insertAsync({ somedata: 'ok' })
      await d.insertAsync({ somedata: 'another', plus: 'additional data' })
      await d.insertAsync({ somedata: 'again' })
      // Test with empty object
      const docs = await d.countAsync({})
      assert.equal(docs, 3)
    })

    it('Count all documents matching a basic query', async () => {
      await d.insertAsync({ somedata: 'ok' })
      await d.insertAsync({ somedata: 'again', plus: 'additional data' })
      await d.insertAsync({ somedata: 'again' })
      // Test with query that will return docs
      const docs = await d.countAsync({ somedata: 'again' })
      assert.equal(docs, 2)
      // Test with query that doesn't match anything
      const docs2 = await d.countAsync({ somedata: 'nope' })
      assert.equal(docs2, 0)
    })

    it('Array fields match if any element matches', async () => {
      await d.insertAsync({ fruits: ['pear', 'apple', 'banana'] })
      await d.insertAsync({ fruits: ['coconut', 'orange', 'pear'] })
      await d.insertAsync({ fruits: ['banana'] })
      const docs = await d.countAsync({ fruits: 'pear' })
      assert.equal(docs, 2)

      const docs2 = await d.countAsync({ fruits: 'banana' })
      assert.equal(docs2, 2)

      const docs3 = await d.countAsync({ fruits: 'doesntexist' })
      assert.equal(docs3, 0)
    })

    it('Returns an error if the query is not well formed', async () => {
      await d.insertAsync({ hello: 'world' })
      await assert.rejects(() => d.countAsync({ $or: { hello: 'world' } }))
    })
  })

  describe('Update', function () {
    it('If the query doesn\'t match anything, database is not modified', async () => {
      await d.insertAsync({ somedata: 'ok' })
      await d.insertAsync({ somedata: 'again', plus: 'additional data' })
      await d.insertAsync({ somedata: 'another' })
      // Test with query that doesn't match anything
      const { numAffected } = await d.updateAsync({ somedata: 'nope' }, { newDoc: 'yes' }, { multi: true })
      assert.equal(numAffected, 0)

      const docs = await d.findAsync({})
      const doc1 = docs.find(function (d) { return d.somedata === 'ok' })
      const doc2 = docs.find(function (d) { return d.somedata === 'again' })
      const doc3 = docs.find(function (d) { return d.somedata === 'another' })

      assert.equal(docs.length, 3)
      assert.equal(docs.find(d => d.newDoc === 'yes'), undefined)

      assert.deepEqual(doc1, { _id: doc1._id, somedata: 'ok' })
      assert.deepEqual(doc2, { _id: doc2._id, somedata: 'again', plus: 'additional data' })
      assert.deepEqual(doc3, { _id: doc3._id, somedata: 'another' })
    })

    it('If timestampData option is set, update the updatedAt field', async () => {
      const beginning = Date.now()
      d = new Datastore({ filename: testDb, autoload: true, timestampData: true })
      const insertedDoc = await d.insertAsync({ hello: 'world' })
      assert.ok(insertedDoc.updatedAt.getTime() - beginning < reloadTimeUpperBound)
      assert.ok(insertedDoc.createdAt.getTime() - beginning < reloadTimeUpperBound)
      assert.equal(Object.keys(insertedDoc).length, 4)

      // Wait 100ms before performing the update
      await wait(100)
      const step1 = Date.now()
      await d.updateAsync({ _id: insertedDoc._id }, { $set: { hello: 'mars' } }, {})
      const docs = await d.findAsync({ _id: insertedDoc._id })
      assert.equal(docs.length, 1)
      assert.equal(Object.keys(docs[0]).length, 4)
      assert.equal(docs[0]._id, insertedDoc._id)
      assert.equal(docs[0].createdAt, insertedDoc.createdAt)
      assert.equal(docs[0].hello, 'mars')
      assert.ok(docs[0].updatedAt.getTime() - beginning > 99) // updatedAt modified
      assert.ok(docs[0].updatedAt.getTime() - step1 < reloadTimeUpperBound) // updatedAt modified
    })

    it('Can update multiple documents matching the query', async () => {
      const doc1 = await d.insertAsync({ somedata: 'ok' })
      const doc2 = await d.insertAsync({ somedata: 'again', plus: 'additional data' })
      const doc3 = await d.insertAsync({ somedata: 'again' })
      const id1 = doc1._id
      const id2 = doc2._id
      const id3 = doc3._id
      // Test DB state after update and reload
      const testPostUpdateState = async () => {
        const docs = await d.findAsync({})
        const doc1 = docs.find(d => d._id === id1)
        const doc2 = docs.find(d => d._id === id2)
        const doc3 = docs.find(d => d._id === id3)

        assert.equal(docs.length, 3)

        assert.equal(Object.keys(doc1).length, 2)
        assert.equal(doc1.somedata, 'ok')
        assert.equal(doc1._id, id1)

        assert.equal(Object.keys(doc2).length, 2)
        assert.equal(doc2.newDoc, 'yes')
        assert.equal(doc2._id, id2)

        assert.equal(Object.keys(doc3).length, 2)
        assert.equal(doc3.newDoc, 'yes')
        assert.equal(doc3._id, id3)
      }

      const { numAffected } = await d.updateAsync({ somedata: 'again' }, { newDoc: 'yes' }, { multi: true })
      assert.equal(numAffected, 2)

      await testPostUpdateState()
      await d.loadDatabaseAsync()
      await testPostUpdateState()
    })

    it('Can update only one document matching the query', async () => {
      const doc1 = await d.insertAsync({ somedata: 'ok' })
      const doc2 = await d.insertAsync({ somedata: 'again', plus: 'additional data' })
      const doc3 = await d.insertAsync({ somedata: 'again' })
      const id1 = doc1._id
      const id2 = doc2._id
      const id3 = doc3._id

      // Test DB state after update and reload
      const testPostUpdateState = async () => {
        const docs = await d.findAsync({})
        const doc1 = docs.find(d => d._id === id1)
        const doc2 = docs.find(d => d._id === id2)
        const doc3 = docs.find(d => d._id === id3)

        assert.equal(docs.length, 3)

        assert.deepEqual(doc1, { somedata: 'ok', _id: doc1._id })

        // doc2 or doc3 was modified. Since we sort on _id and it is random
        // it can be either of two situations
        try {
          assert.deepEqual(doc2, { newDoc: 'yes', _id: doc2._id })
          assert.deepEqual(doc3, { somedata: 'again', _id: doc3._id })
        } catch (e) {
          assert.deepEqual(doc2, { somedata: 'again', plus: 'additional data', _id: doc2._id })
          assert.deepEqual(doc3, { newDoc: 'yes', _id: doc3._id })
        }
      }

      // Test with query that doesn't match anything
      const { numAffected } = await d.updateAsync({ somedata: 'again' }, { newDoc: 'yes' }, { multi: false })
      assert.equal(numAffected, 1)

      await testPostUpdateState()
      await d.loadDatabaseAsync()
      await testPostUpdateState()
    })
  })

  describe('Upserts', function () {
    it('Can perform upserts if needed', async () => {
      const {
        numAffected: numAffectedEmpty,
        affectedDocuments: affectedDocumentsEmpty
      } = await d.updateAsync({ impossible: 'db is empty anyway' }, { newDoc: true }, {})
      assert.equal(numAffectedEmpty, 0)
      assert.equal(affectedDocumentsEmpty, null)

      const docsEmpty = await d.findAsync({})
      assert.equal(docsEmpty.length, 0) // Default option for upsert is false

      const {
        numAffected,
        affectedDocuments
      } = await d.updateAsync({ impossible: 'db is empty anyway' }, { something: 'created ok' }, { upsert: true })
      assert.equal(numAffected, 1)
      assert.equal(affectedDocuments.something, 'created ok')
      assert.notEqual(affectedDocuments._id, undefined)

      const docs = await d.findAsync({})
      assert.equal(docs.length, 1) // Default option for upsert is false
      assert.equal(docs[0].something, 'created ok')

      // Modifying the returned upserted document doesn't modify the database
      affectedDocuments.newField = true
      const docsModified = await d.findAsync({})
      assert.equal(docsModified[0].something, 'created ok')
      assert.equal(docsModified[0].newField, undefined)
    })

    it('If the update query is a normal object with no modifiers, it is the doc that will be upserted', async () => {
      await d.updateAsync({ $or: [{ a: 4 }, { a: 5 }] }, { hello: 'world', bloup: 'blap' }, { upsert: true })
      const docs = await d.findAsync({})
      assert.equal(docs.length, 1)
      const doc = docs[0]
      assert.equal(Object.keys(doc).length, 3)
      assert.equal(doc.hello, 'world')
      assert.equal(doc.bloup, 'blap')
    })

    it('If the update query contains modifiers, it is applied to the object resulting from removing all operators from the find query 1', async () => {
      await d.updateAsync({ $or: [{ a: 4 }, { a: 5 }] }, {
        $set: { hello: 'world' },
        $inc: { bloup: 3 }
        // eslint-disable-next-line node/handle-callback-err
      }, { upsert: true })
      const docs = await d.findAsync({ hello: 'world' })
      assert.equal(docs.length, 1)
      const doc = docs[0]
      assert.equal(Object.keys(doc).length, 3)
      assert.equal(doc.hello, 'world')
      assert.equal(doc.bloup, 3)
    })

    it('If the update query contains modifiers, it is applied to the object resulting from removing all operators from the find query 2', async () => {
      await d.updateAsync({ $or: [{ a: 4 }, { a: 5 }], cac: 'rrr' }, {
        $set: { hello: 'world' },
        $inc: { bloup: 3 }
        // eslint-disable-next-line node/handle-callback-err
      }, { upsert: true })
      const docs = await d.findAsync({ hello: 'world' })
      assert.equal(docs.length, 1)
      const doc = docs[0]
      assert.equal(Object.keys(doc).length, 4)
      assert.equal(doc.cac, 'rrr')
      assert.equal(doc.hello, 'world')
      assert.equal(doc.bloup, 3)
    })

    it('Performing upsert with badly formatted fields yields a standard error not an exception', async () => {
      await assert.rejects(() => d.updateAsync({ _id: '1234' }, { $set: { $$badfield: 5 } }, { upsert: true }))
    }) // ==== End of 'Upserts' ==== //

    it('Cannot perform update if the update query is not either registered-modifiers-only or copy-only, or contain badly formatted fields', async () => {
      await d.insertAsync({ something: 'yup' })
      await assert.rejects(() => d.updateAsync({}, { boom: { $badfield: 5 } }, { multi: false }))
      await assert.rejects(() => d.updateAsync({}, { boom: { 'bad.field': 5 } }, { multi: false }))
      await assert.rejects(() => d.updateAsync({}, { $inc: { test: 5 }, mixed: 'rrr' }, { multi: false }))
      await assert.rejects(() => d.updateAsync({}, { $inexistent: { test: 5 } }, { multi: false }))
    })

    it('Can update documents using multiple modifiers', async () => {
      const newDoc = await d.insertAsync({ something: 'yup', other: 40 })
      const id = newDoc._id

      const { numAffected } = await d.updateAsync({}, {
        $set: { something: 'changed' },
        $inc: { other: 10 }
      }, { multi: false })
      assert.equal(numAffected, 1)

      const doc = await d.findOneAsync({ _id: id })
      assert.equal(Object.keys(doc).length, 3)
      assert.equal(doc._id, id)
      assert.equal(doc.something, 'changed')
      assert.equal(doc.other, 50)
    })

    it('Can upsert a document even with modifiers', async () => {
      const {
        numAffected,
        affectedDocuments
      } = await d.updateAsync({ bloup: 'blap' }, { $set: { hello: 'world' } }, { upsert: true })
      assert.equal(numAffected, 1)
      assert.equal(affectedDocuments.bloup, 'blap')
      assert.equal(affectedDocuments.hello, 'world')
      assert.notEqual(affectedDocuments._id, undefined)

      const docs = await d.findAsync({})
      assert.equal(docs.length, 1)
      assert.equal(Object.keys(docs[0]).length, 3)
      assert.equal(docs[0].hello, 'world')
      assert.equal(docs[0].bloup, 'blap')
      assert.notEqual(docs[0]._id, undefined)
    })

    it('When using modifiers, the only way to update subdocs is with the dot-notation', async () => {
      await d.insertAsync({ bloup: { blip: 'blap', other: true } })
      // Correct methos
      await d.updateAsync({}, { $set: { 'bloup.blip': 'hello' } }, {})
      const doc = await d.findOneAsync({})
      assert.equal(doc.bloup.blip, 'hello')
      assert.equal(doc.bloup.other, true)

      // Wrong
      await d.updateAsync({}, { $set: { bloup: { blip: 'ola' } } }, {})
      const doc2 = await d.findOneAsync({})
      assert.equal(doc2.bloup.blip, 'ola')
      assert.equal(doc2.bloup.other, undefined) // This information was lost
    })

    it('Returns an error if the query is not well formed', async () => {
      await d.insertAsync({ hello: 'world' })
      await assert.rejects(() => d.updateAsync({ $or: { hello: 'world' } }, { a: 1 }, {}))
    })

    it('If an error is thrown by a modifier, the database state is not changed', async () => {
      const newDoc = await d.insertAsync({ hello: 'world' })
      await assert.rejects(() => d.updateAsync({}, { $inc: { hello: 4 } }, {}))

      const docs = await d.findAsync({})
      assert.deepEqual(docs, [{ _id: newDoc._id, hello: 'world' }])
    })

    it('Cant change the _id of a document', async () => {
      const newDoc = await d.insertAsync({ a: 2 })
      await assert.rejects(() => d.updateAsync({ a: 2 }, { a: 2, _id: 'nope' }, {}))
      const docs = await d.findAsync({})
      assert.equal(docs.length, 1)
      assert.equal(Object.keys(docs[0]).length, 2)
      assert.equal(docs[0].a, 2)
      assert.equal(docs[0]._id, newDoc._id)

      await assert.rejects(() => d.updateAsync({ a: 2 }, { $set: { _id: 'nope' } }, {}))
      const docs2 = await d.findAsync({})
      assert.equal(docs2.length, 1)
      assert.equal(Object.keys(docs2[0]).length, 2)
      assert.equal(docs2[0].a, 2)
      assert.equal(docs2[0]._id, newDoc._id)
    })

    it('Non-multi updates are persistent', async () => {
      const doc1 = await d.insertAsync({ a: 1, hello: 'world' })
      const doc2 = await d.insertAsync({ a: 2, hello: 'earth' })
      await d.updateAsync({ a: 2 }, { $set: { hello: 'changed' } }, {})

      const docs = await d.findAsync({})
      docs.sort((a, b) => a.a - b.a)
      assert.equal(docs.length, 2)
      assert.deepEqual(docs[0], { _id: doc1._id, a: 1, hello: 'world' })
      assert.deepEqual(docs[1], { _id: doc2._id, a: 2, hello: 'changed' })

      // Even after a reload the database state hasn't changed
      await d.loadDatabaseAsync()

      const docs2 = await d.findAsync({})
      docs2.sort((a, b) => a.a - b.a)
      assert.equal(docs2.length, 2)
      assert.deepEqual(docs2[0], { _id: doc1._id, a: 1, hello: 'world' })
      assert.deepEqual(docs2[1], { _id: doc2._id, a: 2, hello: 'changed' })
    })

    it('Multi updates are persistent', async () => {
      const doc1 = await d.insertAsync({ a: 1, hello: 'world' })
      const doc2 = await d.insertAsync({ a: 2, hello: 'earth' })
      const doc3 = await d.insertAsync({ a: 5, hello: 'pluton' })
      await d.updateAsync({ a: { $in: [1, 2] } }, { $set: { hello: 'changed' } }, { multi: true })

      const docs = await d.findAsync({})
      docs.sort((a, b) => a.a - b.a)
      assert.equal(docs.length, 3)
      assert.deepEqual(docs[0], { _id: doc1._id, a: 1, hello: 'changed' })
      assert.deepEqual(docs[1], { _id: doc2._id, a: 2, hello: 'changed' })
      assert.deepEqual(docs[2], { _id: doc3._id, a: 5, hello: 'pluton' })

      // Even after a reload the database state hasn't changed
      await d.loadDatabaseAsync()

      const docs2 = await d.findAsync({})
      docs2.sort((a, b) => a.a - b.a)
      assert.equal(docs2.length, 3)
      assert.deepEqual(docs2[0], { _id: doc1._id, a: 1, hello: 'changed' })
      assert.deepEqual(docs2[1], { _id: doc2._id, a: 2, hello: 'changed' })
      assert.deepEqual(docs2[2], { _id: doc3._id, a: 5, hello: 'pluton' })
    })

    it('Can update without the options arg (will use defaults then)', async () => {
      const doc1 = await d.insertAsync({ a: 1, hello: 'world' })
      const doc2 = await d.insertAsync({ a: 2, hello: 'earth' })
      const doc3 = await d.insertAsync({ a: 5, hello: 'pluton' })
      const { numAffected } = await d.updateAsync({ a: 2 }, { $inc: { a: 10 } })
      assert.equal(numAffected, 1)
      const docs = await d.findAsync({})
      const d1 = docs.find(doc => doc._id === doc1._id)
      const d2 = docs.find(doc => doc._id === doc2._id)
      const d3 = docs.find(doc => doc._id === doc3._id)

      assert.equal(d1.a, 1)
      assert.equal(d2.a, 12)
      assert.equal(d3.a, 5)
    })

    it('If a multi update fails on one document, previous updates should be rolled back', async () => {
      await d.ensureIndexAsync({ fieldName: 'a' })
      const doc1 = await d.insertAsync({ a: 4 })
      const doc2 = await d.insertAsync({ a: 5 })
      const doc3 = await d.insertAsync({ a: 'abc' })
      // With this query, candidates are always returned in the order 4, 5, 'abc' so it's always the last one which fails
      await assert.rejects(() => d.updateAsync({ a: { $in: [4, 5, 'abc'] } }, { $inc: { a: 10 } }, { multi: true }))

      // No index modified
      for (const key in d.indexes) {
        if (Object.prototype.hasOwnProperty.call(d.indexes, key)) {
          const index = d.indexes[key]
          const docs = index.getAll()
          const d1 = docs.find(doc => doc._id === doc1._id)
          const d2 = docs.find(doc => doc._id === doc2._id)
          const d3 = docs.find(doc => doc._id === doc3._id)

          // All changes rolled back, including those that didn't trigger an error
          assert.equal(d1.a, 4)
          assert.equal(d2.a, 5)
          assert.equal(d3.a, 'abc')
        }
      }
    })

    it('If an index constraint is violated by an update, all changes should be rolled back', async () => {
      await d.ensureIndexAsync({ fieldName: 'a', unique: true })
      const doc1 = await d.insertAsync({ a: 4 })
      const doc2 = await d.insertAsync({ a: 5 })
      // With this query, candidates are always returned in the order 4, 5, 'abc' so it's always the last one which fails
      await assert.rejects(() => d.updateAsync({ a: { $in: [4, 5, 'abc'] } }, { $set: { a: 10 } }, { multi: true }))

      // Check that no index was modified
      for (const key in d.indexes) {
        if (Object.prototype.hasOwnProperty.call(d.indexes, key)) {
          const index = d.indexes[key]
          const docs = index.getAll()
          const d1 = docs.find(doc => doc._id === doc1._id)
          const d2 = docs.find(doc => doc._id === doc2._id)

          assert.equal(d1.a, 4)
          assert.equal(d2.a, 5)
        }
      }
    })

    it('If options.returnUpdatedDocs is true, return all matched docs', async () => {
      const docs = await d.insertAsync([{ a: 4 }, { a: 5 }, { a: 6 }])
      assert.equal(docs.length, 3)

      const {
        numAffected: numAffectedEmpty,
        affectedDocuments: affectedDocumentsEmpty
      } = await d.updateAsync({ a: 7 }, { $set: { u: 1 } }, {
        multi: true,
        returnUpdatedDocs: true
      })
      assert.equal(numAffectedEmpty, 0)
      assert.equal(affectedDocumentsEmpty.length, 0)

      const { numAffected, affectedDocuments } = await d.updateAsync({ a: 5 }, { $set: { u: 2 } }, {
        multi: true,
        returnUpdatedDocs: true
      })
      assert.equal(numAffected, 1)
      assert.equal(affectedDocuments.length, 1)
      assert.equal(affectedDocuments[0].a, 5)
      assert.equal(affectedDocuments[0].u, 2)

      const {
        numAffected: numAffected2,
        affectedDocuments: affectedDocuments2
      } = await d.updateAsync({ a: { $in: [4, 6] } }, { $set: { u: 3 } }, {
        multi: true,
        returnUpdatedDocs: true
      })
      assert.equal(numAffected2, 2)
      assert.equal(affectedDocuments2.length, 2)
      assert.equal(affectedDocuments2[0].u, 3)
      assert.equal(affectedDocuments2[1].u, 3)
      if (affectedDocuments2[0].a === 4) {
        assert.equal(affectedDocuments2[0].a, 4)
        assert.equal(affectedDocuments2[1].a, 6)
      } else {
        assert.equal(affectedDocuments2[0].a, 6)
        assert.equal(affectedDocuments2[1].a, 4)
      }
    })

    it('createdAt property is unchanged and updatedAt correct after an update, even a complete document replacement', async () => {
      const d2 = new Datastore({ inMemoryOnly: true, timestampData: true })
      await d2.insertAsync({ a: 1 })
      const doc = await d2.findOneAsync({ a: 1 })
      const createdAt = doc.createdAt.getTime()

      // Modifying update
      await wait(20)
      await d2.updateAsync({ a: 1 }, { $set: { b: 2 } }, {})
      const doc2 = await d2.findOneAsync({ a: 1 })
      assert.equal(doc2.createdAt.getTime(), createdAt)
      assert.ok(Date.now() - doc2.updatedAt.getTime() < 5)

      // Complete replacement
      await wait(20)
      await d2.updateAsync({ a: 1 }, { c: 3 }, {})
      const doc3 = await d2.findOneAsync({ c: 3 })
      assert.equal(doc3.createdAt.getTime(), createdAt)
      assert.ok(Date.now() - doc3.updatedAt.getTime() < 5)
    })
  })

  describe('Callback signature', function () {
    it('Regular update, multi false', async () => {
      await d.insertAsync({ a: 1 })
      await d.insertAsync({ a: 2 })

      // returnUpdatedDocs set to false
      const { numAffected, affectedDocuments, upsert } = await d.updateAsync({ a: 1 }, { $set: { b: 20 } }, {})
      assert.equal(numAffected, 1)
      assert.equal(affectedDocuments, null)
      assert.equal(upsert, false)

      // returnUpdatedDocs set to true
      const {
        numAffected: numAffected2,
        affectedDocuments: affectedDocuments2,
        upsert: upsert2
      } = await d.updateAsync({ a: 1 }, { $set: { b: 21 } }, { returnUpdatedDocs: true })
      assert.equal(numAffected2, 1)
      assert.equal(affectedDocuments2.a, 1)
      assert.equal(affectedDocuments2.b, 21)
      assert.equal(upsert2, false)
    })

    it('Regular update, multi true', async () => {
      await d.insertAsync({ a: 1 })
      await d.insertAsync({ a: 2 })

      // returnUpdatedDocs set to false
      const {
        numAffected,
        affectedDocuments,
        upsert
      } = await d.updateAsync({}, { $set: { b: 20 } }, { multi: true })
      assert.equal(numAffected, 2)
      assert.equal(affectedDocuments, null)
      assert.equal(upsert, false)

      // returnUpdatedDocs set to true
      const {
        numAffected: numAffected2,
        affectedDocuments: affectedDocuments2,
        upsert: upsert2
      } = await d.updateAsync({}, { $set: { b: 21 } }, {
        multi: true,
        returnUpdatedDocs: true
      })
      assert.equal(numAffected2, 2)
      assert.equal(affectedDocuments2.length, 2)
      assert.equal(upsert2, false)
    })

    it('Upsert', async () => {
      await d.insertAsync({ a: 1 })
      await d.insertAsync({ a: 2 })

      // Upsert flag not set
      const { numAffected, affectedDocuments, upsert } = await d.updateAsync({ a: 3 }, { $set: { b: 20 } }, {})
      assert.equal(numAffected, 0)
      assert.equal(affectedDocuments, null)
      assert.equal(upsert, false)

      // Upsert flag set
      const {
        numAffected: numAffected2,
        affectedDocuments: affectedDocuments2,
        upsert: upsert2
      } = await d.updateAsync({ a: 3 }, { $set: { b: 21 } }, { upsert: true })
      assert.equal(numAffected2, 1)
      assert.equal(affectedDocuments2.a, 3)
      assert.equal(affectedDocuments2.b, 21)
      assert.equal(upsert2, true)

      const docs = await d.findAsync({})
      assert.equal(docs.length, 3)
    }) // ==== End of 'Update - Callback signature' ==== //
  }) // ==== End of 'Update' ==== //
  describe('Remove', function () {
    it('Can remove multiple documents', async () => {
      const doc1 = await d.insertAsync({ somedata: 'ok' })
      await d.insertAsync({ somedata: 'again', plus: 'additional data' })
      await d.insertAsync({ somedata: 'again' })
      const id1 = doc1._id

      // Test DB status
      const testPostUpdateState = async () => {
        const docs = await d.findAsync({})
        assert.equal(docs.length, 1)

        assert.equal(Object.keys(docs[0]).length, 2)
        assert.equal(docs[0]._id, id1)
        assert.equal(docs[0].somedata, 'ok')
      }
      // Test with query that doesn't match anything
      const n = await d.removeAsync({ somedata: 'again' }, { multi: true })
      assert.equal(n, 2)
      await testPostUpdateState()
      await d.loadDatabaseAsync()
      await testPostUpdateState()
    })

    // This tests concurrency issues
    it('Remove can be called multiple times in parallel and everything that needs to be removed will be', async () => {
      await d.insertAsync({ planet: 'Earth' })
      await d.insertAsync({ planet: 'Mars' })
      await d.insertAsync({ planet: 'Saturn' })
      const docs = await d.findAsync({})
      assert.equal(docs.length, 3)

      // Remove two docs simultaneously
      const toRemove = ['Mars', 'Saturn']
      await Promise.all(toRemove.map(planet => d.removeAsync({ planet })))
      const docs2 = await d.findAsync({})
      assert.equal(docs2.length, 1)
    })

    it('Returns an error if the query is not well formed', async () => {
      await d.insertAsync({ hello: 'world' })
      await assert.rejects(() => d.removeAsync({ $or: { hello: 'world' } }, {}))
    })

    it('Non-multi removes are persistent', async () => {
      const doc1 = await d.insertAsync({ a: 1, hello: 'world' })
      await d.insertAsync({ a: 2, hello: 'earth' })
      const doc3 = await d.insertAsync({ a: 3, hello: 'moto' })
      await d.removeAsync({ a: 2 }, {})

      const docs = await d.findAsync({})
      docs.sort((a, b) => a.a - b.a)
      assert.equal(docs.length, 2)
      assert.deepEqual(docs[0], { _id: doc1._id, a: 1, hello: 'world' })
      assert.deepEqual(docs[1], { _id: doc3._id, a: 3, hello: 'moto' })

      // Even after a reload the database state hasn't changed
      await d.loadDatabaseAsync()

      const docsReloaded = await d.findAsync({})
      docsReloaded.sort((a, b) => a.a - b.a)
      assert.equal(docsReloaded.length, 2)
      assert.deepEqual(docsReloaded[0], { _id: doc1._id, a: 1, hello: 'world' })
      assert.deepEqual(docsReloaded[1], { _id: doc3._id, a: 3, hello: 'moto' })
    })

    it('Multi removes are persistent', async () => {
      await d.insertAsync({ a: 1, hello: 'world' })
      const doc2 = await d.insertAsync({ a: 2, hello: 'earth' })
      await d.insertAsync({ a: 3, hello: 'moto' })
      await d.removeAsync({ a: { $in: [1, 3] } }, { multi: true })

      const docs = await d.findAsync({})
      assert.equal(docs.length, 1)
      assert.deepEqual(docs[0], { _id: doc2._id, a: 2, hello: 'earth' })

      // Even after a reload the database state hasn't changed
      await d.loadDatabaseAsync()

      const docsReloaded = await d.findAsync({})
      assert.equal(docsReloaded.length, 1)
      assert.deepEqual(docsReloaded[0], { _id: doc2._id, a: 2, hello: 'earth' })
    })

    it('Can remove without the options arg (will use defaults then)', async () => {
      const doc1 = await d.insertAsync({ a: 1, hello: 'world' })
      const doc2 = await d.insertAsync({ a: 2, hello: 'earth' })
      const doc3 = await d.insertAsync({ a: 5, hello: 'pluton' })
      const numRemoved = await d.removeAsync({ a: 2 })
      assert.equal(numRemoved, 1)
      const docs = await d.findAsync({})
      const d1 = docs.find(doc => doc._id === doc1._id)
      const d2 = docs.find(doc => doc._id === doc2._id)
      const d3 = docs.find(doc => doc._id === doc3._id)

      assert.equal(d1.a, 1)
      assert.equal(d2, undefined)
      assert.equal(d3.a, 5)
    })
  }) // ==== End of 'Remove' ==== //

  describe('Using indexes', function () {
    describe('ensureIndex and index initialization in database loading', function () {
      it('ensureIndex can be called right after a loadDatabase and be initialized and filled correctly', async () => {
        const now = new Date()
        const rawData = model.serialize({ _id: 'aaa', z: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
          model.serialize({ _id: 'bbb', z: '2', hello: 'world' }) + '\n' +
          model.serialize({ _id: 'ccc', z: '3', nested: { today: now } })

        assert.equal(d.getAllData().length, 0)

        await fs.writeFile(testDb, rawData, 'utf8')
        await d.loadDatabaseAsync()
        assert.equal(d.getAllData().length, 3)

        assert.deepEqual(Object.keys(d.indexes), ['_id'])

        await d.ensureIndexAsync({ fieldName: 'z' })
        assert.equal(d.indexes.z.fieldName, 'z')
        assert.equal(d.indexes.z.unique, false)
        assert.equal(d.indexes.z.sparse, false)
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.z.tree.search('1')[0], d.getAllData()[0])
        assert.equal(d.indexes.z.tree.search('2')[0], d.getAllData()[1])
        assert.equal(d.indexes.z.tree.search('3')[0], d.getAllData()[2])
      })

      it('ensureIndex can be called twice on the same field, the second call will ahve no effect', async () => {
        assert.equal(Object.keys(d.indexes).length, 1)
        assert.equal(Object.keys(d.indexes)[0], '_id')

        await d.insertAsync({ planet: 'Earth' })
        await d.insertAsync({ planet: 'Mars' })
        const docs = await d.findAsync({})
        assert.equal(docs.length, 2)

        await d.ensureIndexAsync({ fieldName: 'planet' })
        assert.equal(Object.keys(d.indexes).length, 2)
        assert.equal(Object.keys(d.indexes)[0], '_id')
        assert.equal(Object.keys(d.indexes)[1], 'planet')

        assert.equal(d.indexes.planet.getAll().length, 2)

        // This second call has no effect, documents don't get inserted twice in the index
        await d.ensureIndexAsync({ fieldName: 'planet' })
        assert.equal(Object.keys(d.indexes).length, 2)
        assert.equal(Object.keys(d.indexes)[0], '_id')
        assert.equal(Object.keys(d.indexes)[1], 'planet')

        assert.equal(d.indexes.planet.getAll().length, 2)
      })

      it('ensureIndex can be called after the data set was modified and the index still be correct', async () => {
        const rawData = model.serialize({ _id: 'aaa', z: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
          model.serialize({ _id: 'bbb', z: '2', hello: 'world' })

        assert.equal(d.getAllData().length, 0)

        await fs.writeFile(testDb, rawData, 'utf8')
        await d.loadDatabaseAsync()
        assert.equal(d.getAllData().length, 2)

        assert.deepEqual(Object.keys(d.indexes), ['_id'])

        // eslint-disable-next-line node/handle-callback-err
        const newDoc1 = await d.insertAsync({ z: '12', yes: 'yes' })
        // eslint-disable-next-line node/handle-callback-err
        const newDoc2 = await d.insertAsync({ z: '14', nope: 'nope' })
        await d.removeAsync({ z: '2' }, {})
        await d.updateAsync({ z: '1' }, { $set: { yes: 'yep' } }, {})
        assert.deepEqual(Object.keys(d.indexes), ['_id'])

        await d.ensureIndexAsync({ fieldName: 'z' })
        assert.equal(d.indexes.z.fieldName, 'z')
        assert.equal(d.indexes.z.unique, false)
        assert.equal(d.indexes.z.sparse, false)
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 3)

        // The pointers in the _id and z indexes are the same
        assert.equal(d.indexes.z.tree.search('1')[0], d.indexes._id.getMatching('aaa')[0])
        assert.equal(d.indexes.z.tree.search('12')[0], d.indexes._id.getMatching(newDoc1._id)[0])
        assert.equal(d.indexes.z.tree.search('14')[0], d.indexes._id.getMatching(newDoc2._id)[0])

        // The data in the z index is correct
        const docs = await d.findAsync({})
        const doc0 = docs.find(doc => doc._id === 'aaa')
        const doc1 = docs.find(doc => doc._id === newDoc1._id)
        const doc2 = docs.find(doc => doc._id === newDoc2._id)

        assert.equal(docs.length, 3)

        assert.deepEqual(doc0, { _id: 'aaa', z: '1', a: 2, ages: [1, 5, 12], yes: 'yep' })
        assert.deepEqual(doc1, { _id: newDoc1._id, z: '12', yes: 'yes' })
        assert.deepEqual(doc2, { _id: newDoc2._id, z: '14', nope: 'nope' })
      })

      it('ensureIndex can be called before a loadDatabase and still be initialized and filled correctly', async () => {
        const now = new Date()
        const rawData = model.serialize({ _id: 'aaa', z: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
          model.serialize({ _id: 'bbb', z: '2', hello: 'world' }) + '\n' +
          model.serialize({ _id: 'ccc', z: '3', nested: { today: now } })

        assert.equal(d.getAllData().length, 0)

        await d.ensureIndexAsync({ fieldName: 'z' })
        assert.equal(d.indexes.z.fieldName, 'z')
        assert.equal(d.indexes.z.unique, false)
        assert.equal(d.indexes.z.sparse, false)
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 0)

        await fs.writeFile(testDb, rawData, 'utf8')
        await d.loadDatabaseAsync()
        const doc1 = d.getAllData().find(doc => doc.z === '1')
        const doc2 = d.getAllData().find(doc => doc.z === '2')
        const doc3 = d.getAllData().find(doc => doc.z === '3')

        assert.equal(d.getAllData().length, 3)

        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.z.tree.search('1')[0], doc1)
        assert.equal(d.indexes.z.tree.search('2')[0], doc2)
        assert.equal(d.indexes.z.tree.search('3')[0], doc3)
      })

      it('Can initialize multiple indexes on a database load', async () => {
        const now = new Date()
        const rawData = model.serialize({ _id: 'aaa', z: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
          model.serialize({ _id: 'bbb', z: '2', a: 'world' }) + '\n' +
          model.serialize({ _id: 'ccc', z: '3', a: { today: now } })

        assert.equal(d.getAllData().length, 0)
        await d.ensureIndexAsync({ fieldName: 'z' })
        await d.ensureIndexAsync({ fieldName: 'a' })
        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 0)
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 0)

        await fs.writeFile(testDb, rawData, 'utf8')
        await d.loadDatabaseAsync()
        const doc1 = d.getAllData().find(doc => doc.z === '1')
        const doc2 = d.getAllData().find(doc => doc.z === '2')
        const doc3 = d.getAllData().find(doc => doc.z === '3')

        assert.equal(d.getAllData().length, 3)

        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.z.tree.search('1')[0], doc1)
        assert.equal(d.indexes.z.tree.search('2')[0], doc2)
        assert.equal(d.indexes.z.tree.search('3')[0], doc3)

        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.a.tree.search(2)[0], doc1)
        assert.equal(d.indexes.a.tree.search('world')[0], doc2)
        assert.equal(d.indexes.a.tree.search({ today: now })[0], doc3)
      })

      it('If a unique constraint is not respected, database loading will not work and no data will be inserted', async () => {
        const now = new Date()
        const rawData = model.serialize({ _id: 'aaa', z: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
          model.serialize({ _id: 'bbb', z: '2', a: 'world' }) + '\n' +
          model.serialize({ _id: 'ccc', z: '1', a: { today: now } })

        assert.equal(d.getAllData().length, 0)

        await d.ensureIndexAsync({ fieldName: 'z', unique: true })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 0)

        await fs.writeFile(testDb, rawData, 'utf8')
        await assert.rejects(() => d.loadDatabaseAsync(), err => {
          assert.equal(err.errorType, 'uniqueViolated')
          assert.equal(err.key, '1')
          return true
        })
        assert.equal(d.getAllData().length, 0)
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 0)
      })

      it('If a unique constraint is not respected, ensureIndex will return an error and not create an index', async () => {
        await d.insertAsync({ a: 1, b: 4 })
        await d.insertAsync({ a: 2, b: 45 })
        await d.insertAsync({ a: 1, b: 3 })
        await d.ensureIndexAsync({ fieldName: 'b' })
        await assert.rejects(() => d.ensureIndexAsync({ fieldName: 'a', unique: true }), err => {
          assert.equal(err.errorType, 'uniqueViolated')
          assert.deepEqual(Object.keys(d.indexes), ['_id', 'b'])
          return true
        })
      })

      it('Can remove an index', async () => {
        await d.ensureIndexAsync({ fieldName: 'e' })

        assert.equal(Object.keys(d.indexes).length, 2)
        assert.notEqual(d.indexes.e, null)

        await d.removeIndexAsync('e')
        assert.equal(Object.keys(d.indexes).length, 1)
        assert.equal(d.indexes.e, undefined)
      })
    }) // ==== End of 'ensureIndex and index initialization in database loading' ==== //

    describe('Indexing newly inserted documents', function () {
      it('Newly inserted documents are indexed', async () => {
        await d.ensureIndexAsync({ fieldName: 'z' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 0)

        const newDoc = await d.insertAsync({ a: 2, z: 'yes' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 1)
        assert.deepEqual(d.indexes.z.getMatching('yes'), [newDoc])

        const newDoc2 = await d.insertAsync({ a: 5, z: 'nope' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 2)
        assert.deepEqual(d.indexes.z.getMatching('nope'), [newDoc2])
      })

      it('If multiple indexes are defined, the document is inserted in all of them', async () => {
        await d.ensureIndexAsync({ fieldName: 'z' })
        await d.ensureIndexAsync({ fieldName: 'ya' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 0)

        const newDoc = await d.insertAsync({ a: 2, z: 'yes', ya: 'indeed' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 1)
        assert.equal(d.indexes.ya.tree.getNumberOfKeys(), 1)
        assert.deepEqual(d.indexes.z.getMatching('yes'), [newDoc])
        assert.deepEqual(d.indexes.ya.getMatching('indeed'), [newDoc])

        const newDoc2 = await d.insertAsync({ a: 5, z: 'nope', ya: 'sure' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.ya.tree.getNumberOfKeys(), 2)
        assert.deepEqual(d.indexes.z.getMatching('nope'), [newDoc2])
        assert.deepEqual(d.indexes.ya.getMatching('sure'), [newDoc2])
      })

      it('Can insert two docs at the same key for a non unique index', async () => {
        await d.ensureIndexAsync({ fieldName: 'z' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 0)

        const newDoc = await d.insertAsync({ a: 2, z: 'yes' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 1)
        assert.deepEqual(d.indexes.z.getMatching('yes'), [newDoc])

        const newDoc2 = await d.insertAsync({ a: 5, z: 'yes' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 1)
        assert.deepEqual(d.indexes.z.getMatching('yes'), [newDoc, newDoc2])
      })

      it('If the index has a unique constraint, an error is thrown if it is violated and the data is not modified', async () => {
        await d.ensureIndexAsync({ fieldName: 'z', unique: true })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 0)

        const newDoc = await d.insertAsync({ a: 2, z: 'yes' })
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 1)
        assert.deepEqual(d.indexes.z.getMatching('yes'), [newDoc])

        await assert.rejects(() => d.insertAsync({ a: 5, z: 'yes' }), err => {
          assert.equal(err.errorType, 'uniqueViolated')
          assert.equal(err.key, 'yes')
          return true
        })
        // Index didn't change
        assert.equal(d.indexes.z.tree.getNumberOfKeys(), 1)
        assert.deepEqual(d.indexes.z.getMatching('yes'), [newDoc])

        // Data didn't change
        assert.deepEqual(d.getAllData(), [newDoc])
        await d.loadDatabaseAsync()
        assert.equal(d.getAllData().length, 1)
        assert.deepEqual(d.getAllData()[0], newDoc)
      })

      it('If an index has a unique constraint, other indexes cannot be modified when it raises an error', async () => {
        await d.ensureIndexAsync({ fieldName: 'nonu1' })
        await d.ensureIndexAsync({ fieldName: 'uni', unique: true })
        await d.ensureIndexAsync({ fieldName: 'nonu2' })

        const newDoc = await d.insertAsync({ nonu1: 'yes', nonu2: 'yes2', uni: 'willfail' })
        assert.equal(d.indexes.nonu1.tree.getNumberOfKeys(), 1)
        assert.equal(d.indexes.uni.tree.getNumberOfKeys(), 1)
        assert.equal(d.indexes.nonu2.tree.getNumberOfKeys(), 1)

        await assert.rejects(() => d.insertAsync({ nonu1: 'no', nonu2: 'no2', uni: 'willfail' }), err => {
          assert.equal(err.errorType, 'uniqueViolated')
          return true
        })

        // No index was modified
        assert.equal(d.indexes.nonu1.tree.getNumberOfKeys(), 1)
        assert.equal(d.indexes.uni.tree.getNumberOfKeys(), 1)
        assert.equal(d.indexes.nonu2.tree.getNumberOfKeys(), 1)

        assert.deepEqual(d.indexes.nonu1.getMatching('yes'), [newDoc])
        assert.deepEqual(d.indexes.uni.getMatching('willfail'), [newDoc])
        assert.deepEqual(d.indexes.nonu2.getMatching('yes2'), [newDoc])
      })

      it('Unique indexes prevent you from inserting two docs where the field is undefined except if theyre sparse', async () => {
        await d.ensureIndexAsync({ fieldName: 'zzz', unique: true })
        assert.equal(d.indexes.zzz.tree.getNumberOfKeys(), 0)

        const newDoc = await d.insertAsync({ a: 2, z: 'yes' })
        assert.equal(d.indexes.zzz.tree.getNumberOfKeys(), 1)
        assert.deepEqual(d.indexes.zzz.getMatching(undefined), [newDoc])

        await assert.rejects(() => d.insertAsync({ a: 5, z: 'other' }), err => {
          assert.equal(err.errorType, 'uniqueViolated')
          assert.equal(err.key, undefined)
          return true
        })

        await d.ensureIndexAsync({ fieldName: 'yyy', unique: true, sparse: true })

        await d.insertAsync({ a: 5, z: 'other', zzz: 'set' })
        assert.equal(d.indexes.yyy.getAll().length, 0) // Nothing indexed
        assert.equal(d.indexes.zzz.getAll().length, 2)
      })

      it('Insertion still works as before with indexing', async () => {
        await d.ensureIndexAsync({ fieldName: 'a' })
        await d.ensureIndexAsync({ fieldName: 'b' })

        const doc1 = await d.insertAsync({ a: 1, b: 'hello' })
        const doc2 = await d.insertAsync({ a: 2, b: 'si' })
        const docs = await d.findAsync({})
        assert.deepEqual(doc1, docs.find(function (d) { return d._id === doc1._id }))
        assert.deepEqual(doc2, docs.find(function (d) { return d._id === doc2._id }))
      })

      it('All indexes point to the same data as the main index on _id', async () => {
        await d.ensureIndexAsync({ fieldName: 'a' })

        const doc1 = await d.insertAsync({ a: 1, b: 'hello' })
        const doc2 = await d.insertAsync({ a: 2, b: 'si' })
        const docs = await d.findAsync({})
        assert.equal(docs.length, 2)
        assert.equal(d.getAllData().length, 2)

        assert.equal(d.indexes._id.getMatching(doc1._id).length, 1)
        assert.equal(d.indexes.a.getMatching(1).length, 1)
        assert.equal(d.indexes._id.getMatching(doc1._id)[0], d.indexes.a.getMatching(1)[0])

        assert.equal(d.indexes._id.getMatching(doc2._id).length, 1)
        assert.equal(d.indexes.a.getMatching(2).length, 1)
        assert.equal(d.indexes._id.getMatching(doc2._id)[0], d.indexes.a.getMatching(2)[0])
      })

      it('If a unique constraint is violated, no index is changed, including the main one', async () => {
        await d.ensureIndexAsync({ fieldName: 'a', unique: true })

        const doc1 = await d.insertAsync({ a: 1, b: 'hello' })
        await assert.rejects(() => d.insertAsync({ a: 1, b: 'si' }))

        const docs = await d.findAsync({})
        assert.equal(docs.length, 1)
        assert.equal(d.getAllData().length, 1)

        assert.equal(d.indexes._id.getMatching(doc1._id).length, 1)
        assert.equal(d.indexes.a.getMatching(1).length, 1)
        assert.equal(d.indexes._id.getMatching(doc1._id)[0], d.indexes.a.getMatching(1)[0])

        assert.equal(d.indexes.a.getMatching(2).length, 0)
      })
    }) // ==== End of 'Indexing newly inserted documents' ==== //

    describe('Updating indexes upon document update', function () {
      it('Updating docs still works as before with indexing', async () => {
        await d.ensureIndexAsync({ fieldName: 'a' })

        const _doc1 = await d.insertAsync({ a: 1, b: 'hello' })
        const _doc2 = await d.insertAsync({ a: 2, b: 'si' })
        const { numAffected } = await d.updateAsync({ a: 1 }, { $set: { a: 456, b: 'no' } }, {})
        const data = d.getAllData()
        const doc1 = data.find(doc => doc._id === _doc1._id)
        const doc2 = data.find(doc => doc._id === _doc2._id)

        assert.equal(numAffected, 1)

        assert.equal(data.length, 2)
        assert.deepEqual(doc1, { a: 456, b: 'no', _id: _doc1._id })
        assert.deepEqual(doc2, { a: 2, b: 'si', _id: _doc2._id })

        const { numAffected: numAffectedAfterUpdate } = await d.updateAsync({}, {
          $inc: { a: 10 },
          $set: { b: 'same' }
        }, { multi: true })
        const dataAfterUpdate = d.getAllData()
        const doc1AfterUpdate = dataAfterUpdate.find(doc => doc._id === _doc1._id)
        const doc2AfterUpdate = dataAfterUpdate.find(doc => doc._id === _doc2._id)

        assert.equal(numAffectedAfterUpdate, 2)

        assert.equal(dataAfterUpdate.length, 2)
        assert.deepEqual(doc1AfterUpdate, { a: 466, b: 'same', _id: _doc1._id })
        assert.deepEqual(doc2AfterUpdate, { a: 12, b: 'same', _id: _doc2._id })
      })

      it('Indexes get updated when a document (or multiple documents) is updated', async () => {
        await d.ensureIndexAsync({ fieldName: 'a' })
        await d.ensureIndexAsync({ fieldName: 'b' })

        const doc1 = await d.insertAsync({ a: 1, b: 'hello' })
        const doc2 = await d.insertAsync({ a: 2, b: 'si' })
        // Simple update
        const { numAffected } = await d.updateAsync({ a: 1 }, { $set: { a: 456, b: 'no' } }, {})
        assert.equal(numAffected, 1)

        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.a.getMatching(456)[0]._id, doc1._id)
        assert.equal(d.indexes.a.getMatching(2)[0]._id, doc2._id)

        assert.equal(d.indexes.b.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.b.getMatching('no')[0]._id, doc1._id)
        assert.equal(d.indexes.b.getMatching('si')[0]._id, doc2._id)

        // The same pointers are shared between all indexes
        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.b.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes._id.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.a.getMatching(456)[0], d.indexes._id.getMatching(doc1._id)[0])
        assert.equal(d.indexes.b.getMatching('no')[0], d.indexes._id.getMatching(doc1._id)[0])
        assert.equal(d.indexes.a.getMatching(2)[0], d.indexes._id.getMatching(doc2._id)[0])
        assert.equal(d.indexes.b.getMatching('si')[0], d.indexes._id.getMatching(doc2._id)[0])

        // Multi update
        const { numAffected: numAffectedMulti } = await d.updateAsync({}, {
          $inc: { a: 10 },
          $set: { b: 'same' }
        }, { multi: true })
        assert.equal(numAffectedMulti, 2)

        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.a.getMatching(466)[0]._id, doc1._id)
        assert.equal(d.indexes.a.getMatching(12)[0]._id, doc2._id)

        assert.equal(d.indexes.b.tree.getNumberOfKeys(), 1)
        assert.equal(d.indexes.b.getMatching('same').length, 2)
        assert.ok(d.indexes.b.getMatching('same').map(x => x._id).includes(doc1._id))
        assert.ok(d.indexes.b.getMatching('same').map(x => x._id).includes(doc2._id))

        // The same pointers are shared between all indexes
        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.b.tree.getNumberOfKeys(), 1)
        assert.equal(d.indexes.b.getAll().length, 2)
        assert.equal(d.indexes._id.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.a.getMatching(466)[0], d.indexes._id.getMatching(doc1._id)[0])
        assert.equal(d.indexes.a.getMatching(12)[0], d.indexes._id.getMatching(doc2._id)[0])
        // Can't test the pointers in b as their order is randomized, but it is the same as with a
      })

      it('If a simple update violates a contraint, all changes are rolled back and an error is thrown', async () => {
        await d.ensureIndexAsync({ fieldName: 'a', unique: true })
        await d.ensureIndexAsync({ fieldName: 'b', unique: true })
        await d.ensureIndexAsync({ fieldName: 'c', unique: true })

        const _doc1 = await d.insertAsync({ a: 1, b: 10, c: 100 })
        const _doc2 = await d.insertAsync({ a: 2, b: 20, c: 200 })
        const _doc3 = await d.insertAsync({ a: 3, b: 30, c: 300 })
        // Will conflict with doc3
        await assert.rejects(() => d.updateAsync({ a: 2 }, { $inc: { a: 10, c: 1000 }, $set: { b: 30 } }, {}), err => {
          assert.equal(err.errorType, 'uniqueViolated')
          return true
        })
        const data = d.getAllData()
        const doc1 = data.find(doc => doc._id === _doc1._id)
        const doc2 = data.find(doc => doc._id === _doc2._id)
        const doc3 = data.find(doc => doc._id === _doc3._id)

        // Data left unchanged
        assert.equal(data.length, 3)
        assert.deepEqual(doc1, { a: 1, b: 10, c: 100, _id: _doc1._id })
        assert.deepEqual(doc2, { a: 2, b: 20, c: 200, _id: _doc2._id })
        assert.deepEqual(doc3, { a: 3, b: 30, c: 300, _id: _doc3._id })

        // All indexes left unchanged and pointing to the same docs
        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.a.getMatching(1)[0], doc1)
        assert.equal(d.indexes.a.getMatching(2)[0], doc2)
        assert.equal(d.indexes.a.getMatching(3)[0], doc3)

        assert.equal(d.indexes.b.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.b.getMatching(10)[0], doc1)
        assert.equal(d.indexes.b.getMatching(20)[0], doc2)
        assert.equal(d.indexes.b.getMatching(30)[0], doc3)

        assert.equal(d.indexes.c.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.c.getMatching(100)[0], doc1)
        assert.equal(d.indexes.c.getMatching(200)[0], doc2)
        assert.equal(d.indexes.c.getMatching(300)[0], doc3)
      })

      it('If a multi update violates a contraint, all changes are rolled back and an error is thrown', async () => {
        await d.ensureIndexAsync({ fieldName: 'a', unique: true })
        await d.ensureIndexAsync({ fieldName: 'b', unique: true })
        await d.ensureIndexAsync({ fieldName: 'c', unique: true })

        const _doc1 = await d.insertAsync({ a: 1, b: 10, c: 100 })
        const _doc2 = await d.insertAsync({ a: 2, b: 20, c: 200 })
        const _doc3 = await d.insertAsync({ a: 3, b: 30, c: 300 })
        // Will conflict with doc3
        await assert.rejects(() => d.updateAsync({ a: { $in: [1, 2] } }, {
          $inc: { a: 10, c: 1000 },
          $set: { b: 30 }
        }, { multi: true }), err => {
          assert.equal(err.errorType, 'uniqueViolated')
          return true
        })
        const data = d.getAllData()
        const doc1 = data.find(doc => doc._id === _doc1._id)
        const doc2 = data.find(doc => doc._id === _doc2._id)
        const doc3 = data.find(doc => doc._id === _doc3._id)

        // Data left unchanged
        assert.equal(data.length, 3)
        assert.deepEqual(doc1, { a: 1, b: 10, c: 100, _id: _doc1._id })
        assert.deepEqual(doc2, { a: 2, b: 20, c: 200, _id: _doc2._id })
        assert.deepEqual(doc3, { a: 3, b: 30, c: 300, _id: _doc3._id })

        // All indexes left unchanged and pointing to the same docs
        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.a.getMatching(1)[0], doc1)
        assert.equal(d.indexes.a.getMatching(2)[0], doc2)
        assert.equal(d.indexes.a.getMatching(3)[0], doc3)

        assert.equal(d.indexes.b.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.b.getMatching(10)[0], doc1)
        assert.equal(d.indexes.b.getMatching(20)[0], doc2)
        assert.equal(d.indexes.b.getMatching(30)[0], doc3)

        assert.equal(d.indexes.c.tree.getNumberOfKeys(), 3)
        assert.equal(d.indexes.c.getMatching(100)[0], doc1)
        assert.equal(d.indexes.c.getMatching(200)[0], doc2)
        assert.equal(d.indexes.c.getMatching(300)[0], doc3)
      })
    }) // ==== End of 'Updating indexes upon document update' ==== //

    describe('Updating indexes upon document remove', function () {
      it('Removing docs still works as before with indexing', async () => {
        await d.ensureIndexAsync({ fieldName: 'a' })

        await d.insertAsync({ a: 1, b: 'hello' })
        const _doc2 = await d.insertAsync({ a: 2, b: 'si' })
        const _doc3 = await d.insertAsync({ a: 3, b: 'coin' })
        const numRemoved = await d.removeAsync({ a: 1 }, {})
        const data = d.getAllData()
        const doc2 = data.find(function (doc) { return doc._id === _doc2._id })
        const doc3 = data.find(function (doc) { return doc._id === _doc3._id })

        assert.equal(numRemoved, 1)

        assert.equal(data.length, 2)
        assert.deepEqual(doc2, { a: 2, b: 'si', _id: _doc2._id })
        assert.deepEqual(doc3, { a: 3, b: 'coin', _id: _doc3._id })

        const numRemoved2 = await d.removeAsync({ a: { $in: [2, 3] } }, { multi: true })
        const data2 = d.getAllData()

        assert.equal(numRemoved2, 2)
        assert.equal(data2.length, 0)
      })

      it('Indexes get updated when a document (or multiple documents) is removed', async () => {
        await d.ensureIndexAsync({ fieldName: 'a' })
        await d.ensureIndexAsync({ fieldName: 'b' })

        await d.insertAsync({ a: 1, b: 'hello' })
        const doc2 = await d.insertAsync({ a: 2, b: 'si' })
        const doc3 = await d.insertAsync({ a: 3, b: 'coin' })
        // Simple remove
        const numRemoved = await d.removeAsync({ a: 1 }, {})
        assert.equal(numRemoved, 1)

        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.a.getMatching(2)[0]._id, doc2._id)
        assert.equal(d.indexes.a.getMatching(3)[0]._id, doc3._id)

        assert.equal(d.indexes.b.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.b.getMatching('si')[0]._id, doc2._id)
        assert.equal(d.indexes.b.getMatching('coin')[0]._id, doc3._id)

        // The same pointers are shared between all indexes
        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.b.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes._id.tree.getNumberOfKeys(), 2)
        assert.equal(d.indexes.a.getMatching(2)[0], d.indexes._id.getMatching(doc2._id)[0])
        assert.equal(d.indexes.b.getMatching('si')[0], d.indexes._id.getMatching(doc2._id)[0])
        assert.equal(d.indexes.a.getMatching(3)[0], d.indexes._id.getMatching(doc3._id)[0])
        assert.equal(d.indexes.b.getMatching('coin')[0], d.indexes._id.getMatching(doc3._id)[0])

        // Multi remove
        const numRemovedMulti = await d.removeAsync({}, { multi: true })
        assert.equal(numRemovedMulti, 2)

        assert.equal(d.indexes.a.tree.getNumberOfKeys(), 0)
        assert.equal(d.indexes.b.tree.getNumberOfKeys(), 0)
        assert.equal(d.indexes._id.tree.getNumberOfKeys(), 0)
      })
    }) // ==== End of 'Updating indexes upon document remove' ==== //

    describe('Persisting indexes', function () {
      it('Indexes are persisted to a separate file and recreated upon reload', async () => {
        const persDb = 'workspace/persistIndexes.db'
        let db
        if (await exists(persDb)) await fs.unlink(persDb)
        db = new Datastore({ filename: persDb, autoload: true })

        assert.equal(Object.keys(db.indexes).length, 1)
        assert.equal(Object.keys(db.indexes)[0], '_id')

        await db.insertAsync({ planet: 'Earth' })
        await db.insertAsync({ planet: 'Mars' })

        await db.ensureIndexAsync({ fieldName: 'planet' })
        assert.equal(Object.keys(db.indexes).length, 2)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'planet')
        assert.equal(db.indexes._id.getAll().length, 2)
        assert.equal(db.indexes.planet.getAll().length, 2)
        assert.equal(db.indexes.planet.fieldName, 'planet')

        // After a reload the indexes are recreated
        db = new Datastore({ filename: persDb })
        await db.loadDatabaseAsync()
        assert.equal(Object.keys(db.indexes).length, 2)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'planet')
        assert.equal(db.indexes._id.getAll().length, 2)
        assert.equal(db.indexes.planet.getAll().length, 2)
        assert.equal(db.indexes.planet.fieldName, 'planet')

        // After another reload the indexes are still there (i.e. they are preserved during autocompaction)
        db = new Datastore({ filename: persDb })
        await db.loadDatabaseAsync()
        assert.equal(Object.keys(db.indexes).length, 2)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'planet')
        assert.equal(db.indexes._id.getAll().length, 2)
        assert.equal(db.indexes.planet.getAll().length, 2)
        assert.equal(db.indexes.planet.fieldName, 'planet')
      })

      it('Indexes are persisted with their options and recreated even if some db operation happen between loads', async () => {
        const persDb = 'workspace/persistIndexes.db'
        let db

        if (await exists(persDb)) await fs.unlink(persDb)

        db = new Datastore({ filename: persDb, autoload: true })

        assert.equal(Object.keys(db.indexes).length, 1)
        assert.equal(Object.keys(db.indexes)[0], '_id')

        await db.insertAsync({ planet: 'Earth' })
        await db.insertAsync({ planet: 'Mars' })

        await db.ensureIndexAsync({ fieldName: 'planet', unique: true, sparse: false })
        assert.equal(Object.keys(db.indexes).length, 2)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'planet')
        assert.equal(db.indexes._id.getAll().length, 2)
        assert.equal(db.indexes.planet.getAll().length, 2)
        assert.equal(db.indexes.planet.unique, true)
        assert.equal(db.indexes.planet.sparse, false)

        await db.insertAsync({ planet: 'Jupiter' })

        // After a reload the indexes are recreated
        db = new Datastore({ filename: persDb })
        await db.loadDatabaseAsync()
        assert.equal(Object.keys(db.indexes).length, 2)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'planet')
        assert.equal(db.indexes._id.getAll().length, 3)
        assert.equal(db.indexes.planet.getAll().length, 3)
        assert.equal(db.indexes.planet.unique, true)
        assert.equal(db.indexes.planet.sparse, false)

        await db.ensureIndexAsync({ fieldName: 'bloup', unique: false, sparse: true })
        assert.equal(Object.keys(db.indexes).length, 3)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'planet')
        assert.equal(Object.keys(db.indexes)[2], 'bloup')
        assert.equal(db.indexes._id.getAll().length, 3)
        assert.equal(db.indexes.planet.getAll().length, 3)
        assert.equal(db.indexes.bloup.getAll().length, 0)
        assert.equal(db.indexes.planet.unique, true)
        assert.equal(db.indexes.planet.sparse, false)
        assert.equal(db.indexes.bloup.unique, false)
        assert.equal(db.indexes.bloup.sparse, true)

        // After another reload the indexes are still there (i.e. they are preserved during autocompaction)
        db = new Datastore({ filename: persDb })
        await db.loadDatabaseAsync()
        assert.equal(Object.keys(db.indexes).length, 3)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'planet')
        assert.equal(Object.keys(db.indexes)[2], 'bloup')
        assert.equal(db.indexes._id.getAll().length, 3)
        assert.equal(db.indexes.planet.getAll().length, 3)
        assert.equal(db.indexes.bloup.getAll().length, 0)
        assert.equal(db.indexes.planet.unique, true)
        assert.equal(db.indexes.planet.sparse, false)
        assert.equal(db.indexes.bloup.unique, false)
        assert.equal(db.indexes.bloup.sparse, true)
      })

      it('Indexes can also be removed and the remove persisted', async () => {
        const persDb = 'workspace/persistIndexes.db'
        let db

        if (await exists(persDb)) await fs.unlink(persDb)

        db = new Datastore({ filename: persDb, autoload: true })

        assert.equal(Object.keys(db.indexes).length, 1)
        assert.equal(Object.keys(db.indexes)[0], '_id')

        await db.insertAsync({ planet: 'Earth' })
        await db.insertAsync({ planet: 'Mars' })

        await db.ensureIndexAsync({ fieldName: 'planet' })
        await db.ensureIndexAsync({ fieldName: 'another' })
        assert.equal(Object.keys(db.indexes).length, 3)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'planet')
        assert.equal(Object.keys(db.indexes)[2], 'another')
        assert.equal(db.indexes._id.getAll().length, 2)
        assert.equal(db.indexes.planet.getAll().length, 2)
        assert.equal(db.indexes.planet.fieldName, 'planet')

        // After a reload the indexes are recreated
        db = new Datastore({ filename: persDb })
        await db.loadDatabaseAsync()
        assert.equal(Object.keys(db.indexes).length, 3)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'planet')
        assert.equal(Object.keys(db.indexes)[2], 'another')
        assert.equal(db.indexes._id.getAll().length, 2)
        assert.equal(db.indexes.planet.getAll().length, 2)
        assert.equal(db.indexes.planet.fieldName, 'planet')

        // Index is removed
        await db.removeIndexAsync('planet')
        assert.equal(Object.keys(db.indexes).length, 2)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'another')
        assert.equal(db.indexes._id.getAll().length, 2)

        // After a reload indexes are preserved
        db = new Datastore({ filename: persDb })
        await db.loadDatabaseAsync()
        assert.equal(Object.keys(db.indexes).length, 2)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'another')
        assert.equal(db.indexes._id.getAll().length, 2)

        // After another reload the indexes are still there (i.e. they are preserved during autocompaction)
        db = new Datastore({ filename: persDb })
        await db.loadDatabaseAsync()
        assert.equal(Object.keys(db.indexes).length, 2)
        assert.equal(Object.keys(db.indexes)[0], '_id')
        assert.equal(Object.keys(db.indexes)[1], 'another')
        assert.equal(db.indexes._id.getAll().length, 2)
      })
    }) // ==== End of 'Persisting indexes' ====

    it('Results of getMatching should never contain duplicates', async () => {
      await d.ensureIndexAsync({ fieldName: 'bad' })
      await d.insertAsync({ bad: ['a', 'b'] })
      const res = await d._getCandidatesAsync({ bad: { $in: ['a', 'b'] } })
      assert.equal(res.length, 1)
    })
  }) // ==== End of 'Using indexes' ==== //
})
