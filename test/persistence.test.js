/* eslint-env mocha */
const chai = require('chai')
const testDb = 'workspace/test.db'
const fs = require('fs')
const { apply, waterfall } = require('./utils.test.js')
const model = require('../lib/model')
const Datastore = require('../lib/datastore')
const Persistence = require('../lib/persistence')
const storage = require('../lib/storage')
const { execFile, fork } = require('child_process')
const { callbackify } = require('util')
const { existsCallback } = require('./utils.test')
const { ensureFileDoesntExistAsync } = require('../lib/storage')
const Readable = require('stream').Readable

const { assert } = chai
chai.should()

describe('Persistence', function () {
  let d

  beforeEach(function (done) {
    d = new Datastore({ filename: testDb })
    d.filename.should.equal(testDb)
    d.inMemoryOnly.should.equal(false)

    waterfall([
      function (cb) {
        callbackify((filename) => Persistence.ensureParentDirectoryExistsAsync(filename))(testDb, function () {
          fs.access(testDb, fs.constants.FS_OK, function (err) {
            if (!err) {
              fs.unlink(testDb, cb)
            } else { return cb() }
          })
        })
      },
      function (cb) {
        d.loadDatabase(function (err) {
          assert.isNull(err)
          d.getAllData().length.should.equal(0)
          return cb()
        })
      }
    ], done)
  })

  it('Every line represents a document', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '3', nested: { today: now } })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort(function (a, b) { return a._id - b._id })
    treatedData.length.should.equal(3)
    assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepStrictEqual(treatedData[1], { _id: '2', hello: 'world' })
    assert.deepStrictEqual(treatedData[2], { _id: '3', nested: { today: now } })
  })

  it('Every line represents a document (with stream)', function (done) {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '3', nested: { today: now } })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    callbackify(rawStream => d.persistence.treatRawStreamAsync(rawStream))(stream, function (err, result) {
      assert.isNull(err)
      const treatedData = result.data
      treatedData.sort(function (a, b) { return a._id - b._id })
      treatedData.length.should.equal(3)
      assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
      assert.deepStrictEqual(treatedData[1], { _id: '2', hello: 'world' })
      assert.deepStrictEqual(treatedData[2], { _id: '3', nested: { today: now } })
      done()
    })
  })

  it('Badly formatted lines have no impact on the treated data', function () {
    d.persistence.corruptAlertThreshold = 1 // to prevent a corruption alert
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      'garbage\n' +
      model.serialize({ _id: '3', nested: { today: now } })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort(function (a, b) { return a._id - b._id })
    treatedData.length.should.equal(2)
    assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepStrictEqual(treatedData[1], { _id: '3', nested: { today: now } })
  })

  it('Badly formatted lines have no impact on the treated data (with stream)', function (done) {
    d.persistence.corruptAlertThreshold = 1 // to prevent a corruption alert
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      'garbage\n' +
      model.serialize({ _id: '3', nested: { today: now } })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    callbackify(rawStream => d.persistence.treatRawStreamAsync(rawStream))(stream, function (err, result) {
      assert.isNull(err)
      const treatedData = result.data
      treatedData.sort(function (a, b) { return a._id - b._id })
      treatedData.length.should.equal(2)
      assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
      assert.deepStrictEqual(treatedData[1], { _id: '3', nested: { today: now } })
      done()
    })
  })

  it('Well formatted lines that have no _id are not included in the data', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ nested: { today: now } })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort(function (a, b) { return a._id - b._id })
    treatedData.length.should.equal(2)
    assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepStrictEqual(treatedData[1], { _id: '2', hello: 'world' })
  })

  it('Well formatted lines that have no _id are not included in the data (with stream)', function (done) {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ nested: { today: now } })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    callbackify(rawStream => d.persistence.treatRawStreamAsync(rawStream))(stream, function (err, result) {
      assert.isNull(err)
      const treatedData = result.data
      treatedData.sort(function (a, b) { return a._id - b._id })
      treatedData.length.should.equal(2)
      assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
      assert.deepStrictEqual(treatedData[1], { _id: '2', hello: 'world' })
      done()
    })
  })

  it('If two lines concern the same doc (= same _id), the last one is the good version', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '1', nested: { today: now } })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort(function (a, b) { return a._id - b._id })
    treatedData.length.should.equal(2)
    assert.deepStrictEqual(treatedData[0], { _id: '1', nested: { today: now } })
    assert.deepStrictEqual(treatedData[1], { _id: '2', hello: 'world' })
  })

  it('If two lines concern the same doc (= same _id), the last one is the good version (with stream)', function (done) {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '1', nested: { today: now } })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    callbackify(rawStream => d.persistence.treatRawStreamAsync(rawStream))(stream, function (err, result) {
      assert.isNull(err)
      const treatedData = result.data
      treatedData.sort(function (a, b) { return a._id - b._id })
      treatedData.length.should.equal(2)
      assert.deepStrictEqual(treatedData[0], { _id: '1', nested: { today: now } })
      assert.deepStrictEqual(treatedData[1], { _id: '2', hello: 'world' })
      done()
    })
  })

  it('If a doc contains $$deleted: true, that means we need to remove it from the data', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '1', $$deleted: true }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort(function (a, b) { return a._id - b._id })
    treatedData.length.should.equal(2)
    assert.deepStrictEqual(treatedData[0], { _id: '2', hello: 'world' })
    assert.deepStrictEqual(treatedData[1], { _id: '3', today: now })
  })

  it('If a doc contains $$deleted: true, that means we need to remove it from the data (with stream)', function (done) {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', hello: 'world' }) + '\n' +
      model.serialize({ _id: '1', $$deleted: true }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    callbackify(rawStream => d.persistence.treatRawStreamAsync(rawStream))(stream, function (err, result) {
      assert.isNull(err)
      const treatedData = result.data
      treatedData.sort(function (a, b) { return a._id - b._id })
      treatedData.length.should.equal(2)
      assert.deepStrictEqual(treatedData[0], { _id: '2', hello: 'world' })
      assert.deepStrictEqual(treatedData[1], { _id: '3', today: now })
      done()
    })
  })

  it('If a doc contains $$deleted: true, no error is thrown if the doc wasnt in the list before', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', $$deleted: true }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const treatedData = d.persistence.treatRawData(rawData).data

    treatedData.sort(function (a, b) { return a._id - b._id })
    treatedData.length.should.equal(2)
    assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepStrictEqual(treatedData[1], { _id: '3', today: now })
  })

  it('If a doc contains $$deleted: true, no error is thrown if the doc wasnt in the list before (with stream)', function (done) {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ _id: '2', $$deleted: true }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    callbackify(rawStream => d.persistence.treatRawStreamAsync(rawStream))(stream, function (err, result) {
      assert.isNull(err)
      const treatedData = result.data
      treatedData.sort(function (a, b) { return a._id - b._id })
      treatedData.length.should.equal(2)
      assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
      assert.deepStrictEqual(treatedData[1], { _id: '3', today: now })
      done()
    })
  })

  it('If a doc contains $$indexCreated, no error is thrown during treatRawData and we can get the index options', function () {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ $$indexCreated: { fieldName: 'test', unique: true } }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const treatedData = d.persistence.treatRawData(rawData).data
    const indexes = d.persistence.treatRawData(rawData).indexes

    Object.keys(indexes).length.should.equal(1)
    assert.deepStrictEqual(indexes.test, { fieldName: 'test', unique: true })

    treatedData.sort(function (a, b) { return a._id - b._id })
    treatedData.length.should.equal(2)
    assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
    assert.deepStrictEqual(treatedData[1], { _id: '3', today: now })
  })

  it('If a doc contains $$indexCreated, no error is thrown during treatRawData and we can get the index options (with stream)', function (done) {
    const now = new Date()
    const rawData = model.serialize({ _id: '1', a: 2, ages: [1, 5, 12] }) + '\n' +
      model.serialize({ $$indexCreated: { fieldName: 'test', unique: true } }) + '\n' +
      model.serialize({ _id: '3', today: now })
    const stream = new Readable()

    stream.push(rawData)
    stream.push(null)

    callbackify(rawStream => d.persistence.treatRawStreamAsync(rawStream))(stream, function (err, result) {
      assert.isNull(err)
      const treatedData = result.data
      const indexes = result.indexes
      Object.keys(indexes).length.should.equal(1)
      assert.deepStrictEqual(indexes.test, { fieldName: 'test', unique: true })

      treatedData.sort(function (a, b) { return a._id - b._id })
      treatedData.length.should.equal(2)
      assert.deepStrictEqual(treatedData[0], { _id: '1', a: 2, ages: [1, 5, 12] })
      assert.deepStrictEqual(treatedData[1], { _id: '3', today: now })
      done()
    })
  })

  it('Compact database on load', function (done) {
    d.insert({ a: 2 }, function () {
      d.insert({ a: 4 }, function () {
        d.remove({ a: 2 }, {}, function () {
          // Here, the underlying file is 3 lines long for only one document
          const data = fs.readFileSync(d.filename, 'utf8').split('\n')
          let filledCount = 0

          data.forEach(function (item) { if (item.length > 0) { filledCount += 1 } })
          filledCount.should.equal(3)

          d.loadDatabase(function (err) {
            assert.isNull(err)

            // Now, the file has been compacted and is only 1 line long
            const data = fs.readFileSync(d.filename, 'utf8').split('\n')
            let filledCount = 0

            data.forEach(function (item) { if (item.length > 0) { filledCount += 1 } })
            filledCount.should.equal(1)

            done()
          })
        })
      })
    })
  })

  it('Calling loadDatabase after the data was modified doesnt change its contents', function (done) {
    d.loadDatabase(function () {
      d.insert({ a: 1 }, function (err) {
        assert.isNull(err)
        d.insert({ a: 2 }, function (err) {
          const data = d.getAllData()
          const doc1 = data.find(function (doc) { return doc.a === 1 })
          const doc2 = data.find(function (doc) { return doc.a === 2 })
          assert.isNull(err)
          data.length.should.equal(2)
          doc1.a.should.equal(1)
          doc2.a.should.equal(2)

          d.loadDatabase(function (err) {
            const data = d.getAllData()
            const doc1 = data.find(function (doc) { return doc.a === 1 })
            const doc2 = data.find(function (doc) { return doc.a === 2 })
            assert.isNull(err)
            data.length.should.equal(2)
            doc1.a.should.equal(1)
            doc2.a.should.equal(2)

            done()
          })
        })
      })
    })
  })

  it('Calling loadDatabase after the datafile was removed will reset the database', function (done) {
    d.loadDatabase(function () {
      d.insert({ a: 1 }, function (err) {
        assert.isNull(err)
        d.insert({ a: 2 }, function (err) {
          const data = d.getAllData()
          const doc1 = data.find(function (doc) { return doc.a === 1 })
          const doc2 = data.find(function (doc) { return doc.a === 2 })
          assert.isNull(err)
          data.length.should.equal(2)
          doc1.a.should.equal(1)
          doc2.a.should.equal(2)

          fs.unlink(testDb, function (err) {
            assert.isNull(err)
            d.loadDatabase(function (err) {
              assert.isNull(err)
              d.getAllData().length.should.equal(0)

              done()
            })
          })
        })
      })
    })
  })

  it('Calling loadDatabase after the datafile was modified loads the new data', function (done) {
    d.loadDatabase(function () {
      d.insert({ a: 1 }, function (err) {
        assert.isNull(err)
        d.insert({ a: 2 }, function (err) {
          const data = d.getAllData()
          const doc1 = data.find(function (doc) { return doc.a === 1 })
          const doc2 = data.find(function (doc) { return doc.a === 2 })
          assert.isNull(err)
          data.length.should.equal(2)
          doc1.a.should.equal(1)
          doc2.a.should.equal(2)

          fs.writeFile(testDb, '{"a":3,"_id":"aaa"}', 'utf8', function (err) {
            assert.isNull(err)
            d.loadDatabase(function (err) {
              const data = d.getAllData()
              const doc1 = data.find(function (doc) { return doc.a === 1 })
              const doc2 = data.find(function (doc) { return doc.a === 2 })
              const doc3 = data.find(function (doc) { return doc.a === 3 })
              assert.isNull(err)
              data.length.should.equal(1)
              doc3.a.should.equal(3)
              assert.isUndefined(doc1)
              assert.isUndefined(doc2)

              done()
            })
          })
        })
      })
    })
  })

  it('When treating raw data, refuse to proceed if too much data is corrupt, to avoid data loss', function (done) {
    const corruptTestFilename = 'workspace/corruptTest.db'
    const fakeData = '{"_id":"one","hello":"world"}\n' + 'Some corrupt data\n' + '{"_id":"two","hello":"earth"}\n' + '{"_id":"three","hello":"you"}\n'
    let d
    fs.writeFileSync(corruptTestFilename, fakeData, 'utf8')

    // Default corruptAlertThreshold
    d = new Datastore({ filename: corruptTestFilename })
    d.loadDatabase(function (err) {
      assert.isDefined(err)
      assert.isNotNull(err)
      assert.hasAllKeys(err, ['corruptionRate', 'corruptItems', 'dataLength'])
      assert.strictEqual(err.corruptionRate, 0.25)
      assert.strictEqual(err.corruptItems, 1)
      assert.strictEqual(err.dataLength, 4)

      fs.writeFileSync(corruptTestFilename, fakeData, 'utf8')
      d = new Datastore({ filename: corruptTestFilename, corruptAlertThreshold: 1 })
      d.loadDatabase(function (err) {
        assert.isNull(err)

        fs.writeFileSync(corruptTestFilename, fakeData, 'utf8')
        d = new Datastore({ filename: corruptTestFilename, corruptAlertThreshold: 0 })
        d.loadDatabase(function (err) {
          assert.isDefined(err)
          assert.isNotNull(err)

          assert.hasAllKeys(err, ['corruptionRate', 'corruptItems', 'dataLength'])
          assert.strictEqual(err.corruptionRate, 0.25)
          assert.strictEqual(err.corruptItems, 1)
          assert.strictEqual(err.dataLength, 4)

          done()
        })
      })
    })
  })

  it('Can listen to compaction events', function (done) {
    d.oncompaction = function () {
      d.oncompaction = null // Tidy up for next tests
      done()
    }

    d.compactDatafile()
  })

  describe('Serialization hooks', function () {
    const as = function (s) { return 'before_' + s + '_after' }
    const bd = function (s) { return s.substring(7, s.length - 6) }

    it('Declaring only one hook will throw an exception to prevent data loss', function (done) {
      const hookTestFilename = 'workspace/hookTest.db'
      callbackify(storage.ensureFileDoesntExistAsync)(hookTestFilename, function () {
        fs.writeFileSync(hookTestFilename, 'Some content', 'utf8');

        (function () {
          // eslint-disable-next-line no-new
          new Datastore({
            filename: hookTestFilename,
            autoload: true,
            afterSerialization: as
          })
        }).should.throw()

        // Data file left untouched
        fs.readFileSync(hookTestFilename, 'utf8').should.equal('Some content');

        (function () {
          // eslint-disable-next-line no-new
          new Datastore({
            filename: hookTestFilename,
            autoload: true,
            beforeDeserialization: bd
          })
        }).should.throw()

        // Data file left untouched
        fs.readFileSync(hookTestFilename, 'utf8').should.equal('Some content')

        done()
      })
    })

    it('Declaring two hooks that are not reverse of one another will cause an exception to prevent data loss', function (done) {
      const hookTestFilename = 'workspace/hookTest.db'
      callbackify(storage.ensureFileDoesntExistAsync)(hookTestFilename, function () {
        fs.writeFileSync(hookTestFilename, 'Some content', 'utf8');

        (function () {
          // eslint-disable-next-line no-new
          new Datastore({
            filename: hookTestFilename,
            autoload: true,
            afterSerialization: as,
            beforeDeserialization: function (s) { return s }
          })
        }).should.throw()

        // Data file left untouched
        fs.readFileSync(hookTestFilename, 'utf8').should.equal('Some content')

        done()
      })
    })

    it('A serialization hook can be used to transform data before writing new state to disk', function (done) {
      const hookTestFilename = 'workspace/hookTest.db'
      callbackify(storage.ensureFileDoesntExistAsync)(hookTestFilename, function () {
        const d = new Datastore({
          filename: hookTestFilename,
          autoload: true,
          afterSerialization: as,
          beforeDeserialization: bd
        })

        d.insert({ hello: 'world' }, function () {
          const _data = fs.readFileSync(hookTestFilename, 'utf8')
          const data = _data.split('\n')
          let doc0 = bd(data[0])

          data.length.should.equal(2)

          data[0].substring(0, 7).should.equal('before_')
          data[0].substring(data[0].length - 6).should.equal('_after')

          doc0 = model.deserialize(doc0)
          Object.keys(doc0).length.should.equal(2)
          doc0.hello.should.equal('world')

          d.insert({ p: 'Mars' }, function () {
            const _data = fs.readFileSync(hookTestFilename, 'utf8')
            const data = _data.split('\n')
            let doc0 = bd(data[0])
            let doc1 = bd(data[1])

            data.length.should.equal(3)

            data[0].substring(0, 7).should.equal('before_')
            data[0].substring(data[0].length - 6).should.equal('_after')
            data[1].substring(0, 7).should.equal('before_')
            data[1].substring(data[1].length - 6).should.equal('_after')

            doc0 = model.deserialize(doc0)
            Object.keys(doc0).length.should.equal(2)
            doc0.hello.should.equal('world')

            doc1 = model.deserialize(doc1)
            Object.keys(doc1).length.should.equal(2)
            doc1.p.should.equal('Mars')

            d.ensureIndex({ fieldName: 'idefix' }, function () {
              const _data = fs.readFileSync(hookTestFilename, 'utf8')
              const data = _data.split('\n')
              let doc0 = bd(data[0])
              let doc1 = bd(data[1])
              let idx = bd(data[2])

              data.length.should.equal(4)

              data[0].substring(0, 7).should.equal('before_')
              data[0].substring(data[0].length - 6).should.equal('_after')
              data[1].substring(0, 7).should.equal('before_')
              data[1].substring(data[1].length - 6).should.equal('_after')

              doc0 = model.deserialize(doc0)
              Object.keys(doc0).length.should.equal(2)
              doc0.hello.should.equal('world')

              doc1 = model.deserialize(doc1)
              Object.keys(doc1).length.should.equal(2)
              doc1.p.should.equal('Mars')

              idx = model.deserialize(idx)
              assert.deepStrictEqual(idx, { $$indexCreated: { fieldName: 'idefix' } })

              done()
            })
          })
        })
      })
    })

    it('Use serialization hook when persisting cached database or compacting', function (done) {
      const hookTestFilename = 'workspace/hookTest.db'
      callbackify(storage.ensureFileDoesntExistAsync)(hookTestFilename, function () {
        const d = new Datastore({
          filename: hookTestFilename,
          autoload: true,
          afterSerialization: as,
          beforeDeserialization: bd
        })

        d.insert({ hello: 'world' }, function () {
          d.update({ hello: 'world' }, { $set: { hello: 'earth' } }, {}, function () {
            d.ensureIndex({ fieldName: 'idefix' }, function () {
              const _data = fs.readFileSync(hookTestFilename, 'utf8')
              const data = _data.split('\n')
              let doc0 = bd(data[0])
              let doc1 = bd(data[1])
              let idx = bd(data[2])

              data.length.should.equal(4)

              doc0 = model.deserialize(doc0)
              Object.keys(doc0).length.should.equal(2)
              doc0.hello.should.equal('world')

              doc1 = model.deserialize(doc1)
              Object.keys(doc1).length.should.equal(2)
              doc1.hello.should.equal('earth')

              doc0._id.should.equal(doc1._id)
              const _id = doc0._id

              idx = model.deserialize(idx)
              assert.deepStrictEqual(idx, { $$indexCreated: { fieldName: 'idefix' } })

              callbackify(() => d.persistence.persistCachedDatabaseAsync())(function () {
                const _data = fs.readFileSync(hookTestFilename, 'utf8')
                const data = _data.split('\n')
                let doc0 = bd(data[0])
                let idx = bd(data[1])

                data.length.should.equal(3)

                doc0 = model.deserialize(doc0)
                Object.keys(doc0).length.should.equal(2)
                doc0.hello.should.equal('earth')

                doc0._id.should.equal(_id)

                idx = model.deserialize(idx)
                assert.deepStrictEqual(idx, { $$indexCreated: { fieldName: 'idefix', unique: false, sparse: false } })

                done()
              })
            })
          })
        })
      })
    })

    it('Deserialization hook is correctly used when loading data', function (done) {
      const hookTestFilename = 'workspace/hookTest.db'
      callbackify(storage.ensureFileDoesntExistAsync)(hookTestFilename, function () {
        const d = new Datastore({
          filename: hookTestFilename,
          autoload: true,
          afterSerialization: as,
          beforeDeserialization: bd
        })

        // eslint-disable-next-line n/handle-callback-err
        d.insert({ hello: 'world' }, function (err, doc) {
          const _id = doc._id
          d.insert({ yo: 'ya' }, function () {
            d.update({ hello: 'world' }, { $set: { hello: 'earth' } }, {}, function () {
              d.remove({ yo: 'ya' }, {}, function () {
                d.ensureIndex({ fieldName: 'idefix' }, function () {
                  const _data = fs.readFileSync(hookTestFilename, 'utf8')
                  const data = _data.split('\n')

                  data.length.should.equal(6)

                  // Everything is deserialized correctly, including deletes and indexes
                  const d = new Datastore({
                    filename: hookTestFilename,
                    afterSerialization: as,
                    beforeDeserialization: bd
                  })
                  d.loadDatabase(function () {
                    // eslint-disable-next-line n/handle-callback-err
                    d.find({}, function (err, docs) {
                      docs.length.should.equal(1)
                      docs[0].hello.should.equal('earth')
                      docs[0]._id.should.equal(_id)

                      Object.keys(d.indexes).length.should.equal(2)
                      Object.keys(d.indexes).indexOf('idefix').should.not.equal(-1)

                      done()
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  }) // ==== End of 'Serialization hooks' ==== //

  describe('Prevent dataloss when persisting data', function () {
    it('Creating a datastore with in memory as true and a bad filename wont cause an error', function () {
      // eslint-disable-next-line no-new
      new Datastore({ filename: 'workspace/bad.db~', inMemoryOnly: true })
    })

    it('Creating a persistent datastore with a bad filename will cause an error', function () {
      // eslint-disable-next-line no-new
      (function () { new Datastore({ filename: 'workspace/bad.db~' }) }).should.throw()
    })

    it('If no file stat, ensureDatafileIntegrity creates an empty datafile', function (done) {
      const p = new Persistence({ db: { inMemoryOnly: false, filename: 'workspace/it.db' } })

      if (fs.existsSync('workspace/it.db')) { fs.unlinkSync('workspace/it.db') }
      if (fs.existsSync('workspace/it.db~')) { fs.unlinkSync('workspace/it.db~') }

      fs.existsSync('workspace/it.db').should.equal(false)
      fs.existsSync('workspace/it.db~').should.equal(false)

      callbackify(storage.ensureDatafileIntegrityAsync)(p.filename, function (err) {
        assert.isNull(err)

        fs.existsSync('workspace/it.db').should.equal(true)
        fs.existsSync('workspace/it.db~').should.equal(false)

        fs.readFileSync('workspace/it.db', 'utf8').should.equal('')

        done()
      })
    })

    it('If only datafile stat, ensureDatafileIntegrity will use it', function (done) {
      const p = new Persistence({ db: { inMemoryOnly: false, filename: 'workspace/it.db' } })

      if (fs.existsSync('workspace/it.db')) { fs.unlinkSync('workspace/it.db') }
      if (fs.existsSync('workspace/it.db~')) { fs.unlinkSync('workspace/it.db~') }

      fs.writeFileSync('workspace/it.db', 'something', 'utf8')

      fs.existsSync('workspace/it.db').should.equal(true)
      fs.existsSync('workspace/it.db~').should.equal(false)

      callbackify(storage.ensureDatafileIntegrityAsync)(p.filename, function (err) {
        assert.isNull(err)

        fs.existsSync('workspace/it.db').should.equal(true)
        fs.existsSync('workspace/it.db~').should.equal(false)

        fs.readFileSync('workspace/it.db', 'utf8').should.equal('something')

        done()
      })
    })

    it('If temp datafile stat and datafile doesnt, ensureDatafileIntegrity will use it (cannot happen except upon first use)', function (done) {
      const p = new Persistence({ db: { inMemoryOnly: false, filename: 'workspace/it.db' } })

      if (fs.existsSync('workspace/it.db')) { fs.unlinkSync('workspace/it.db') }
      if (fs.existsSync('workspace/it.db~')) { fs.unlinkSync('workspace/it.db~~') }

      fs.writeFileSync('workspace/it.db~', 'something', 'utf8')

      fs.existsSync('workspace/it.db').should.equal(false)
      fs.existsSync('workspace/it.db~').should.equal(true)

      callbackify(storage.ensureDatafileIntegrityAsync)(p.filename, function (err) {
        assert.isNull(err)

        fs.existsSync('workspace/it.db').should.equal(true)
        fs.existsSync('workspace/it.db~').should.equal(false)

        fs.readFileSync('workspace/it.db', 'utf8').should.equal('something')

        done()
      })
    })

    // Technically it could also mean the write was successful but the rename wasn't, but there is in any case no guarantee that the data in the temp file is whole so we have to discard the whole file
    it('If both temp and current datafiles exist, ensureDatafileIntegrity will use the datafile, as it means that the write of the temp file failed', function (done) {
      const theDb = new Datastore({ filename: 'workspace/it.db' })

      if (fs.existsSync('workspace/it.db')) { fs.unlinkSync('workspace/it.db') }
      if (fs.existsSync('workspace/it.db~')) { fs.unlinkSync('workspace/it.db~') }

      fs.writeFileSync('workspace/it.db', '{"_id":"0","hello":"world"}', 'utf8')
      fs.writeFileSync('workspace/it.db~', '{"_id":"0","hello":"other"}', 'utf8')

      fs.existsSync('workspace/it.db').should.equal(true)
      fs.existsSync('workspace/it.db~').should.equal(true)

      callbackify(storage.ensureDatafileIntegrityAsync)(theDb.persistence.filename, function (err) {
        assert.isNull(err)

        fs.existsSync('workspace/it.db').should.equal(true)
        fs.existsSync('workspace/it.db~').should.equal(true)

        fs.readFileSync('workspace/it.db', 'utf8').should.equal('{"_id":"0","hello":"world"}')

        theDb.loadDatabase(function (err) {
          assert.isNull(err)
          theDb.find({}, function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(1)
            docs[0].hello.should.equal('world')
            fs.existsSync('workspace/it.db').should.equal(true)
            fs.existsSync('workspace/it.db~').should.equal(false)
            done()
          })
        })
      })
    })

    it('persistCachedDatabase should update the contents of the datafile and leave a clean state', function (done) {
      d.insert({ hello: 'world' }, function () {
        // eslint-disable-next-line n/handle-callback-err
        d.find({}, function (err, docs) {
          docs.length.should.equal(1)

          if (fs.existsSync(testDb)) { fs.unlinkSync(testDb) }
          if (fs.existsSync(testDb + '~')) { fs.unlinkSync(testDb + '~') }
          fs.existsSync(testDb).should.equal(false)

          fs.writeFileSync(testDb + '~', 'something', 'utf8')
          fs.existsSync(testDb + '~').should.equal(true)

          callbackify(() => d.persistence.persistCachedDatabaseAsync())(function (err) {
            const contents = fs.readFileSync(testDb, 'utf8')
            assert.isNull(err)
            fs.existsSync(testDb).should.equal(true)
            fs.existsSync(testDb + '~').should.equal(false)
            if (!contents.match(/^{"hello":"world","_id":"[0-9a-zA-Z]{16}"}\n$/)) {
              throw new Error('Datafile contents not as expected')
            }
            done()
          })
        })
      })
    })

    it('After a persistCachedDatabase, there should be no temp or old filename', function (done) {
      d.insert({ hello: 'world' }, function () {
        // eslint-disable-next-line n/handle-callback-err
        d.find({}, function (err, docs) {
          docs.length.should.equal(1)

          if (fs.existsSync(testDb)) { fs.unlinkSync(testDb) }
          if (fs.existsSync(testDb + '~')) { fs.unlinkSync(testDb + '~') }
          fs.existsSync(testDb).should.equal(false)
          fs.existsSync(testDb + '~').should.equal(false)

          fs.writeFileSync(testDb + '~', 'bloup', 'utf8')
          fs.existsSync(testDb + '~').should.equal(true)

          callbackify(() => d.persistence.persistCachedDatabaseAsync())(function (err) {
            const contents = fs.readFileSync(testDb, 'utf8')
            assert.isNull(err)
            fs.existsSync(testDb).should.equal(true)
            fs.existsSync(testDb + '~').should.equal(false)
            if (!contents.match(/^{"hello":"world","_id":"[0-9a-zA-Z]{16}"}\n$/)) {
              throw new Error('Datafile contents not as expected')
            }
            done()
          })
        })
      })
    })

    it('persistCachedDatabase should update the contents of the datafile and leave a clean state even if there is a temp datafile', function (done) {
      d.insert({ hello: 'world' }, function () {
        // eslint-disable-next-line n/handle-callback-err
        d.find({}, function (err, docs) {
          docs.length.should.equal(1)

          if (fs.existsSync(testDb)) { fs.unlinkSync(testDb) }
          fs.writeFileSync(testDb + '~', 'blabla', 'utf8')
          fs.existsSync(testDb).should.equal(false)
          fs.existsSync(testDb + '~').should.equal(true)

          callbackify(() => d.persistence.persistCachedDatabaseAsync())(function (err) {
            const contents = fs.readFileSync(testDb, 'utf8')
            assert.isNull(err)
            fs.existsSync(testDb).should.equal(true)
            fs.existsSync(testDb + '~').should.equal(false)
            if (!contents.match(/^{"hello":"world","_id":"[0-9a-zA-Z]{16}"}\n$/)) {
              throw new Error('Datafile contents not as expected')
            }
            done()
          })
        })
      })
    })

    it('persistCachedDatabase should update the contents of the datafile and leave a clean state even if there is a temp datafile', function (done) {
      const dbFile = 'workspace/test2.db'

      if (fs.existsSync(dbFile)) { fs.unlinkSync(dbFile) }
      if (fs.existsSync(dbFile + '~')) { fs.unlinkSync(dbFile + '~') }

      const theDb = new Datastore({ filename: dbFile })

      theDb.loadDatabase(function (err) {
        const contents = fs.readFileSync(dbFile, 'utf8')
        assert.isNull(err)
        fs.existsSync(dbFile).should.equal(true)
        fs.existsSync(dbFile + '~').should.equal(false)
        if (contents !== '') {
          throw new Error('Datafile contents not as expected')
        }
        done()
      })
    })

    it('Persistence works as expected when everything goes fine', function (done) {
      const dbFile = 'workspace/test2.db'
      let theDb, theDb2, doc1, doc2

      waterfall([
        apply(callbackify(storage.ensureFileDoesntExistAsync), dbFile),
        apply(callbackify(storage.ensureFileDoesntExistAsync), dbFile + '~'),
        function (cb) {
          theDb = new Datastore({ filename: dbFile })
          theDb.loadDatabase(cb)
        },
        function (cb) {
          theDb.find({}, function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(0)
            return cb()
          })
        },
        function (cb) {
          theDb.insert({ a: 'hello' }, function (err, _doc1) {
            assert.isNull(err)
            doc1 = _doc1
            theDb.insert({ a: 'world' }, function (err, _doc2) {
              assert.isNull(err)
              doc2 = _doc2
              return cb()
            })
          })
        },
        function (cb) {
          theDb.find({}, function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(2)
            docs.find(function (item) { return item._id === doc1._id }).a.should.equal('hello')
            docs.find(function (item) { return item._id === doc2._id }).a.should.equal('world')
            return cb()
          })
        },
        function (cb) {
          theDb.loadDatabase(cb)
        },
        function (cb) { // No change
          theDb.find({}, function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(2)
            docs.find(function (item) { return item._id === doc1._id }).a.should.equal('hello')
            docs.find(function (item) { return item._id === doc2._id }).a.should.equal('world')
            return cb()
          })
        },
        function (cb) {
          fs.existsSync(dbFile).should.equal(true)
          fs.existsSync(dbFile + '~').should.equal(false)
          return cb()
        },
        function (cb) {
          theDb2 = new Datastore({ filename: dbFile })
          theDb2.loadDatabase(cb)
        },
        function (cb) { // No change in second db
          theDb2.find({}, function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(2)
            docs.find(function (item) { return item._id === doc1._id }).a.should.equal('hello')
            docs.find(function (item) { return item._id === doc2._id }).a.should.equal('world')
            return cb()
          })
        },
        function (cb) {
          fs.existsSync(dbFile).should.equal(true)
          fs.existsSync(dbFile + '~').should.equal(false)
          return cb()
        }
      ], done)
    })

    // The child process will load the database with the given datafile, but the fs.writeFile function
    // is rewritten to crash the process before it finished (after 5000 bytes), to ensure data was not lost
    it('If system crashes during a loadDatabase, the former version is not lost', function (done) {
      const N = 500
      let toWrite = ''
      let i
      let docI

      // Ensuring the state is clean
      if (fs.existsSync('workspace/lac.db')) { fs.unlinkSync('workspace/lac.db') }
      if (fs.existsSync('workspace/lac.db~')) { fs.unlinkSync('workspace/lac.db~') }

      // Creating a db file with 150k records (a bit long to load)
      for (i = 0; i < N; i += 1) {
        toWrite += model.serialize({ _id: 'anid_' + i, hello: 'world' }) + '\n'
      }
      fs.writeFileSync('workspace/lac.db', toWrite, 'utf8')

      const datafileLength = fs.readFileSync('workspace/lac.db', 'utf8').length

      assert(datafileLength > 5000)

      // Loading it in a separate process that we will crash before finishing the loadDatabase
      fork('test_lac/loadAndCrash.test').on('exit', function (code) {
        code.should.equal(1) // See test_lac/loadAndCrash.test.js

        fs.existsSync('workspace/lac.db').should.equal(true)
        fs.existsSync('workspace/lac.db~').should.equal(true)
        fs.readFileSync('workspace/lac.db', 'utf8').length.should.equal(datafileLength)
        fs.readFileSync('workspace/lac.db~', 'utf8').length.should.equal(5000)

        // Reload database without a crash, check that no data was lost and fs state is clean (no temp file)
        const db = new Datastore({ filename: 'workspace/lac.db' })
        db.loadDatabase(function (err) {
          assert.isNull(err)

          fs.existsSync('workspace/lac.db').should.equal(true)
          fs.existsSync('workspace/lac.db~').should.equal(false)
          fs.readFileSync('workspace/lac.db', 'utf8').length.should.equal(datafileLength)

          // eslint-disable-next-line n/handle-callback-err
          db.find({}, function (err, docs) {
            docs.length.should.equal(N)
            for (i = 0; i < N; i += 1) {
              docI = docs.find(function (d) { return d._id === 'anid_' + i })
              assert.isDefined(docI)
              assert.deepStrictEqual({ hello: 'world', _id: 'anid_' + i }, docI)
            }
            return done()
          })
        })
      })
    })

    // Not run on Windows as there is no clean way to set maximum file descriptors. Not an issue as the code itself is tested.
    it('Cannot cause EMFILE errors by opening too many file descriptors', function (done) {
      this.timeout(5000)
      if (process.platform === 'win32' || process.platform === 'win64') { return done() }
      execFile('test_lac/openFdsLaunch.sh', function (err, stdout, stderr) {
        if (err) { return done(err) }

        // The subprocess will not output anything to stdout unless part of the test fails
        if (stdout.length !== 0) {
          return done(stdout)
        } else {
          return done()
        }
      })
    })
  }) // ==== End of 'Prevent dataloss when persisting data' ====

  describe('dropDatabase', function () {
    it('deletes data in memory', done => {
      const inMemoryDB = new Datastore({ inMemoryOnly: true })
      inMemoryDB.insert({ hello: 'world' }, err => {
        assert.equal(err, null)
        inMemoryDB.dropDatabase(err => {
          assert.equal(err, null)
          assert.equal(inMemoryDB.getAllData().length, 0)
          return done()
        })
      })
    })

    it('deletes data in memory & on disk', done => {
      d.insert({ hello: 'world' }, err => {
        if (err) return done(err)
        d.dropDatabase(err => {
          if (err) return done(err)
          assert.equal(d.getAllData().length, 0)
          existsCallback(testDb, bool => {
            assert.equal(bool, false)
            done()
          })
        })
      })
    })

    it('check that executor is drained before drop', done => {
      for (let i = 0; i < 100; i++) {
        d.insert({ hello: 'world' }) // no await
      }
      d.dropDatabase(err => { // it should await the end of the inserts
        if (err) return done(err)
        assert.equal(d.getAllData().length, 0)
        existsCallback(testDb, bool => {
          assert.equal(bool, false)
          done()
        })
      })
    })

    it('check that autocompaction is stopped', done => {
      d.setAutocompactionInterval(5000)
      d.insert({ hello: 'world' }, err => {
        if (err) return done(err)
        d.dropDatabase(err => {
          if (err) return done(err)
          assert.equal(d.autocompactionIntervalId, null)
          assert.equal(d.getAllData().length, 0)
          existsCallback(testDb, bool => {
            assert.equal(bool, false)
            done()
          })
        })
      })
    })

    it('check that we can reload and insert afterwards', done => {
      d.insert({ hello: 'world' }, err => {
        if (err) return done(err)
        d.dropDatabase(err => {
          if (err) return done(err)
          assert.equal(d.getAllData().length, 0)
          existsCallback(testDb, bool => {
            assert.equal(bool, false)
            d.loadDatabase(err => {
              if (err) return done(err)
              d.insert({ hello: 'world' }, err => {
                if (err) return done(err)
                assert.equal(d.getAllData().length, 1)
                d.compactDatafile(err => {
                  if (err) return done(err)
                  existsCallback(testDb, bool => {
                    assert.equal(bool, true)
                    done()
                  })
                })
              })
            })
          })
        })
      })
    })

    it('check that we can dropDatatabase if the file is already deleted', done => {
      callbackify(ensureFileDoesntExistAsync)(testDb, err => {
        if (err) return done(err)
        existsCallback(testDb, bool => {
          assert.equal(bool, false)
          d.dropDatabase(err => {
            if (err) return done(err)
            existsCallback(testDb, bool => {
              assert.equal(bool, false)
              done()
            })
          })
        })
      })
    })

    it('Check that TTL indexes are reset', done => {
      d.ensureIndex({ fieldName: 'expire', expireAfterSeconds: 10 })
      const date = new Date()
      d.insert({ hello: 'world', expire: new Date(date.getTime() - 1000 * 20) }, err => { // expired by 10 seconds
        if (err) return done(err)
        d.find({}, (err, docs) => {
          if (err) return done(err)
          assert.equal(docs.length, 0) // the TTL makes it so that the document is not returned
          d.dropDatabase(err => {
            if (err) return done(err)
            assert.equal(d.getAllData().length, 0)
            existsCallback(testDb, bool => {
              assert.equal(bool, false)
              d.loadDatabase(err => {
                if (err) return done(err)
                d.insert({ hello: 'world', expire: new Date(date.getTime() - 1000 * 20) }, err => {
                  if (err) return done(err)
                  d.find({}, (err, docs) => {
                    if (err) return done(err)
                    assert.equal(docs.length, 1) // the TTL makes it so that the document is not returned
                    d.compactDatafile(err => {
                      if (err) return done(err)
                      existsCallback(testDb, bool => {
                        assert.equal(bool, true)
                        done()
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })

    it('Check that the buffer is reset', done => {
      d.dropDatabase(err => {
        if (err) return done(err)
        // these 3 will hang until load
        d.insert({ hello: 'world' })
        d.insert({ hello: 'world' })
        d.insert({ hello: 'world' })
        assert.equal(d.getAllData().length, 0)
        d.dropDatabase(err => {
          if (err) return done(err)
          d.insert({ hi: 'world' })
          d.loadDatabase(err => {
            if (err) return done(err)
            assert.equal(d.getAllData().length, 1)
            assert.equal(d.getAllData()[0].hi, 'world')
            done()
          })
        })
      })
    })
  }) // ==== End of 'dropDatabase' ====
})
