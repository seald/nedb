/* eslint-env mocha */
/* global chai, Nedb, testUtils */

/**
 * Testing the browser version of NeDB
 * The goal of these tests is not to be exhaustive, we have the server-side NeDB tests for that
 * This is more of a sanity check which executes most of the code at least once and checks
 * it behaves as the server version does
 */

const assert = chai.assert

/**
 * Given a docs array and an id, return the document whose id matches, or null if none is found
 */
function findById (docs, id) {
  return docs.find(function (doc) { return doc._id === id }) || null
}

describe('Basic CRUD functionality', function () {
  it('Able to create a database object in the browser', function () {
    const db = new Nedb()

    assert.strictEqual(db.inMemoryOnly, true)
    assert.strictEqual(db.persistence.inMemoryOnly, true)
  })

  it('Insertion and querying', function (done) {
    const db = new Nedb()

    db.insert({ a: 4 }, function (err, newDoc1) {
      assert.isNull(err)
      db.insert({ a: 40 }, function (err, newDoc2) {
        assert.isNull(err)
        db.insert({ a: 400 }, function (err, newDoc3) {
          assert.isNull(err)

          db.find({ a: { $gt: 36 } }, function (err, docs) {
            const doc2 = docs.find(function (doc) { return doc._id === newDoc2._id })
            const doc3 = docs.find(function (doc) { return doc._id === newDoc3._id })

            assert.isNull(err)
            assert.strictEqual(docs.length, 2)
            assert.strictEqual(doc2.a, 40)
            assert.strictEqual(doc3.a, 400)

            db.find({ a: { $lt: 36 } }, function (err, docs) {
              assert.isNull(err)
              assert.strictEqual(docs.length, 1)
              assert.strictEqual(docs[0].a, 4)
              done()
            })
          })
        })
      })
    })
  })

  it('Querying with regular expressions', function (done) {
    const db = new Nedb()

    db.insert({ planet: 'Earth' }, function (err, newDoc1) {
      assert.isNull(err)
      db.insert({ planet: 'Mars' }, function (err, newDoc2) {
        assert.isNull(err)
        db.insert({ planet: 'Jupiter' }, function (err, newDoc3) {
          assert.isNull(err)
          db.insert({ planet: 'Eaaaaaarth' }, function (err, newDoc4) {
            assert.isNull(err)
            db.insert({ planet: 'Maaaars' }, function (err, newDoc5) {
              assert.isNull(err)

              db.find({ planet: /ar/ }, function (err, docs) {
                assert.isNull(err)
                assert.strictEqual(docs.length, 4)
                assert.strictEqual(docs.find(doc => doc._id === newDoc1._id).planet, 'Earth')
                assert.strictEqual(docs.find(doc => doc._id === newDoc2._id).planet, 'Mars')
                assert.strictEqual(docs.find(doc => doc._id === newDoc4._id).planet, 'Eaaaaaarth')
                assert.strictEqual(docs.find(doc => doc._id === newDoc5._id).planet, 'Maaaars')

                db.find({ planet: /aa+r/ }, function (err, docs) {
                  assert.isNull(err)
                  assert.strictEqual(docs.length, 2)
                  assert.strictEqual(docs.find(doc => doc._id === newDoc4._id).planet, 'Eaaaaaarth')
                  assert.strictEqual(docs.find(doc => doc._id === newDoc5._id).planet, 'Maaaars')

                  done()
                })
              })
            })
          })
        })
      })
    })
  })

  it('Updating documents', function (done) {
    const db = new Nedb()

    // eslint-disable-next-line node/handle-callback-err
    db.insert({ planet: 'Eaaaaarth' }, function (err, newDoc1) {
      // eslint-disable-next-line node/handle-callback-err
      db.insert({ planet: 'Maaaaars' }, function (err, newDoc2) {
        // Simple update
        db.update({ _id: newDoc2._id }, { $set: { planet: 'Saturn' } }, {}, function (err, nr) {
          assert.isNull(err)
          assert.strictEqual(nr, 1)

          // eslint-disable-next-line node/handle-callback-err
          db.find({}, function (err, docs) {
            assert.strictEqual(docs.length, 2)
            assert.strictEqual(findById(docs, newDoc1._id).planet, 'Eaaaaarth')
            assert.strictEqual(findById(docs, newDoc2._id).planet, 'Saturn')

            // Failing update
            db.update({ _id: 'unknown' }, { $inc: { count: 1 } }, {}, function (err, nr) {
              assert.isNull(err)
              assert.strictEqual(nr, 0)

              // eslint-disable-next-line node/handle-callback-err
              db.find({}, function (err, docs) {
                assert.strictEqual(docs.length, 2)
                assert.strictEqual(findById(docs, newDoc1._id).planet, 'Eaaaaarth')
                assert.strictEqual(findById(docs, newDoc2._id).planet, 'Saturn')

                // Document replacement
                db.update({ planet: 'Eaaaaarth' }, { planet: 'Uranus' }, { multi: false }, function (err, nr) {
                  assert.isNull(err)
                  assert.strictEqual(nr, 1)

                  // eslint-disable-next-line node/handle-callback-err
                  db.find({}, function (err, docs) {
                    assert.strictEqual(docs.length, 2)
                    assert.strictEqual(findById(docs, newDoc1._id).planet, 'Uranus')
                    assert.strictEqual(findById(docs, newDoc2._id).planet, 'Saturn')

                    // Multi update
                    db.update({}, { $inc: { count: 3 } }, { multi: true }, function (err, nr) {
                      assert.isNull(err)
                      assert.strictEqual(nr, 2)

                      // eslint-disable-next-line node/handle-callback-err
                      db.find({}, function (err, docs) {
                        assert.strictEqual(docs.length, 2)
                        assert.strictEqual(findById(docs, newDoc1._id).planet, 'Uranus')
                        assert.strictEqual(findById(docs, newDoc1._id).count, 3)
                        assert.strictEqual(findById(docs, newDoc2._id).planet, 'Saturn')
                        assert.strictEqual(findById(docs, newDoc2._id).count, 3)

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
  })

  it('Updating documents: special modifiers', function (done) {
    const db = new Nedb()

    // eslint-disable-next-line node/handle-callback-err
    db.insert({ planet: 'Earth' }, function (err, newDoc1) {
      // Pushing to an array
      db.update({}, { $push: { satellites: 'Phobos' } }, {}, function (err, nr) {
        assert.isNull(err)
        assert.strictEqual(nr, 1)

        // eslint-disable-next-line node/handle-callback-err
        db.findOne({}, function (err, doc) {
          assert.deepStrictEqual(doc, { planet: 'Earth', _id: newDoc1._id, satellites: ['Phobos'] })

          db.update({}, { $push: { satellites: 'Deimos' } }, {}, function (err, nr) {
            assert.isNull(err)
            assert.strictEqual(nr, 1)

            // eslint-disable-next-line node/handle-callback-err
            db.findOne({}, function (err, doc) {
              assert.deepStrictEqual(doc, { planet: 'Earth', _id: newDoc1._id, satellites: ['Phobos', 'Deimos'] })

              done()
            })
          })
        })
      })
    })
  })

  it('Upserts', function (done) {
    const db = new Nedb()

    db.update({ a: 4 }, { $inc: { b: 1 } }, { upsert: true }, function (err, nr, upsert) {
      assert.isNull(err)
      // Return upserted document
      assert.strictEqual(upsert.a, 4)
      assert.strictEqual(upsert.b, 1)
      assert.strictEqual(nr, 1)

      // eslint-disable-next-line node/handle-callback-err
      db.find({}, function (err, docs) {
        assert.strictEqual(docs.length, 1)
        assert.strictEqual(docs[0].a, 4)
        assert.strictEqual(docs[0].b, 1)

        done()
      })
    })
  })

  it('Removing documents', function (done) {
    const db = new Nedb()

    db.insert({ a: 2 })
    db.insert({ a: 5 })
    db.insert({ a: 7 })

    // Multi remove
    db.remove({ a: { $in: [5, 7] } }, { multi: true }, function (err, nr) {
      assert.isNull(err)
      assert.strictEqual(nr, 2)

      // eslint-disable-next-line node/handle-callback-err
      db.find({}, function (err, docs) {
        assert.strictEqual(docs.length, 1)
        assert.strictEqual(docs[0].a, 2)

        // Remove with no match
        db.remove({ b: { $exists: true } }, { multi: true }, function (err, nr) {
          assert.isNull(err)
          assert.strictEqual(nr, 0)

          // eslint-disable-next-line node/handle-callback-err
          db.find({}, function (err, docs) {
            assert.strictEqual(docs.length, 1)
            assert.strictEqual(docs[0].a, 2)

            // Simple remove
            db.remove({ a: { $exists: true } }, { multi: true }, function (err, nr) {
              assert.isNull(err)
              assert.strictEqual(nr, 1)

              // eslint-disable-next-line node/handle-callback-err
              db.find({}, function (err, docs) {
                assert.strictEqual(docs.length, 0)

                done()
              })
            })
          })
        })
      })
    })
  })
}) // ==== End of 'Basic CRUD functionality' ==== //

describe('Indexing', function () {
  it('getCandidates works as expected', function (done) {
    const db = new Nedb()

    db.insert({ a: 4 }, function () {
      db.insert({ a: 6 }, function () {
        db.insert({ a: 7 }, function () {
          // eslint-disable-next-line node/handle-callback-err
          testUtils.callbackify(query => db._getCandidatesAsync(query))({ a: 6 }, function (err, candidates) {
            assert.strictEqual(candidates.length, 3)
            assert.isDefined(candidates.find(function (doc) { return doc.a === 4 }))
            assert.isDefined(candidates.find(function (doc) { return doc.a === 6 }))
            assert.isDefined(candidates.find(function (doc) { return doc.a === 7 }))

            db.ensureIndex({ fieldName: 'a' })

            // eslint-disable-next-line node/handle-callback-err
            testUtils.callbackify(query => db._getCandidatesAsync(query))({ a: 6 }, function (err, candidates) {
              assert.strictEqual(candidates.length, 1)
              assert.isDefined(candidates.find(function (doc) { return doc.a === 6 }))

              done()
            })
          })
        })
      })
    })
  })

  it('Can use indexes to enforce a unique constraint', function (done) {
    const db = new Nedb()

    db.ensureIndex({ fieldName: 'u', unique: true })

    db.insert({ u: 5 }, function (err) {
      assert.isNull(err)

      db.insert({ u: 98 }, function (err) {
        assert.isNull(err)

        db.insert({ u: 5 }, function (err) {
          assert.strictEqual(err.errorType, 'uniqueViolated')

          done()
        })
      })
    })
  })
}) // ==== End of 'Indexing' ==== //

describe("Don't forget to launch persistence tests!", function () {
  const filename = 'test'

  before('Clean & write', function (done) {
    const db = new Nedb({ filename: filename, autoload: true })
    db.remove({}, { multi: true }, function () {
      db.insert({ hello: 'world' }, function (err) {
        assert.isNull(err)
        done()
      })
    })
  })

  it('Read & check', function (done) {
    const db = new Nedb({ filename: filename, autoload: true })
    db.find({}, (err, docs) => {
      assert.isNull(err)
      if (docs.length !== 1) {
        return done(new Error('Unexpected length of document database'))
      }

      if (Object.keys(docs[0]).length !== 2) {
        return done(new Error('Unexpected length insert document in database'))
      }

      if (docs[0].hello !== 'world') {
        return done(new Error('Unexpected document'))
      }

      done()
    })
  })
}) // ===== End of 'persistent in-browser database' =====
