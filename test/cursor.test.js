/* eslint-env mocha */
const chai = require('chai')
const testDb = 'workspace/test.db'
const fs = require('fs')
const { each, waterfall } = require('./utils.test.js')
const Datastore = require('../lib/datastore')
const Persistence = require('../lib/persistence')
const Cursor = require('../lib/cursor')
const { callbackify } = require('util')

const { assert } = chai
chai.should()

describe('Cursor', function () {
  let d

  beforeEach(function (done) {
    d = new Datastore({ filename: testDb })
    d.filename.should.equal(testDb)
    d.inMemoryOnly.should.equal(false)

    waterfall([
      function (cb) {
        callbackify((filename) => Persistence.ensureParentDirectoryExistsAsync(filename))(testDb, function () {
          fs.access(testDb, fs.constants.F_OK, function (err) {
            if (!err) {
              fs.unlink(testDb, cb)
            } else { return cb() }
          })
        })
      },
      async function (cb) {
        await d.loadDatabaseAsync()
        d.getAllData().length.should.equal(0)
        cb()
      }
    ], done)
  })

  describe('Without sorting', function () {
    beforeEach(function (done) {
      // eslint-disable-next-line n/handle-callback-err
      d.insert({ age: 5 }, function (err) {
        // eslint-disable-next-line n/handle-callback-err
        d.insert({ age: 57 }, function (err) {
          // eslint-disable-next-line n/handle-callback-err
          d.insert({ age: 52 }, function (err) {
            // eslint-disable-next-line n/handle-callback-err
            d.insert({ age: 23 }, function (err) {
              // eslint-disable-next-line n/handle-callback-err
              d.insert({ age: 89 }, function (err) {
                return done()
              })
            })
          })
        })
      })
    })

    it('Without query, an empty query or a simple query and no skip or limit', function (done) {
      waterfall([
        function (cb) {
          const cursor = new Cursor(d)
          cursor.exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(5)
            docs.filter(function (doc) { return doc.age === 5 })[0].age.should.equal(5)
            docs.filter(function (doc) { return doc.age === 57 })[0].age.should.equal(57)
            docs.filter(function (doc) { return doc.age === 52 })[0].age.should.equal(52)
            docs.filter(function (doc) { return doc.age === 23 })[0].age.should.equal(23)
            docs.filter(function (doc) { return doc.age === 89 })[0].age.should.equal(89)
            cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          cursor.exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(5)
            docs.filter(function (doc) { return doc.age === 5 })[0].age.should.equal(5)
            docs.filter(function (doc) { return doc.age === 57 })[0].age.should.equal(57)
            docs.filter(function (doc) { return doc.age === 52 })[0].age.should.equal(52)
            docs.filter(function (doc) { return doc.age === 23 })[0].age.should.equal(23)
            docs.filter(function (doc) { return doc.age === 89 })[0].age.should.equal(89)
            cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d, { age: { $gt: 23 } })
          cursor.exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(3)
            docs.filter(function (doc) { return doc.age === 57 })[0].age.should.equal(57)
            docs.filter(function (doc) { return doc.age === 52 })[0].age.should.equal(52)
            docs.filter(function (doc) { return doc.age === 89 })[0].age.should.equal(89)
            cb()
          })
        }
      ], done)
    })

    it('With an empty collection', function (done) {
      waterfall([
        function (cb) {
          d.remove({}, { multi: true }, function (err) { return cb(err) })
        },
        function (cb) {
          const cursor = new Cursor(d)
          cursor.exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(0)
            cb()
          })
        }
      ], done)
    })

    it('With a limit', function (done) {
      const cursor = new Cursor(d)
      cursor.limit(3)
      cursor.exec(function (err, docs) {
        assert.isNull(err)
        docs.length.should.equal(3)
        // No way to predict which results are returned of course ...
        done()
      })
    })

    it('With a skip', function (done) {
      const cursor = new Cursor(d)
      cursor.skip(2).exec(function (err, docs) {
        assert.isNull(err)
        docs.length.should.equal(3)
        // No way to predict which results are returned of course ...
        done()
      })
    })

    it('With a limit and a skip and method chaining', function (done) {
      const cursor = new Cursor(d)
      cursor.limit(4).skip(3) // Only way to know that the right number of results was skipped is if limit + skip > number of results
      cursor.exec(function (err, docs) {
        assert.isNull(err)
        docs.length.should.equal(2)
        // No way to predict which results are returned of course ...
        done()
      })
    })
  }) // ===== End of 'Without sorting' =====

  describe('Sorting of the results', function () {
    beforeEach(function (done) {
      // We don't know the order in which docs wil be inserted but we ensure correctness by testing both sort orders
      // eslint-disable-next-line n/handle-callback-err
      d.insert({ age: 5 }, function (err) {
        // eslint-disable-next-line n/handle-callback-err
        d.insert({ age: 57 }, function (err) {
          // eslint-disable-next-line n/handle-callback-err
          d.insert({ age: 52 }, function (err) {
            // eslint-disable-next-line n/handle-callback-err
            d.insert({ age: 23 }, function (err) {
              // eslint-disable-next-line n/handle-callback-err
              d.insert({ age: 89 }, function (err) {
                return done()
              })
            })
          })
        })
      })
    })

    it('Using one sort', function (done) {
      const cursor = new Cursor(d, {})
      cursor.sort({ age: 1 })
      cursor.exec(function (err, docs) {
        assert.isNull(err)
        // Results are in ascending order
        for (let i = 0; i < docs.length - 1; i += 1) {
          assert(docs[i].age < docs[i + 1].age)
        }

        cursor.sort({ age: -1 })
        cursor.exec(function (err, docs) {
          assert.isNull(err)
          // Results are in descending order
          for (let i = 0; i < docs.length - 1; i += 1) {
            assert(docs[i].age > docs[i + 1].age)
          }

          done()
        })
      })
    })

    it('Sorting strings with custom string comparison function', function (done) {
      const db = new Datastore({
        inMemoryOnly: true,
        autoload: true,
        compareStrings: function (a, b) { return a.length - b.length }
      })

      db.insert({ name: 'alpha' })
      db.insert({ name: 'charlie' })
      db.insert({ name: 'zulu' })

      // eslint-disable-next-line n/handle-callback-err
      db.find({}).sort({ name: 1 }).exec(function (err, docs) {
        docs.map(x => x.name)[0].should.equal('zulu')
        docs.map(x => x.name)[1].should.equal('alpha')
        docs.map(x => x.name)[2].should.equal('charlie')

        delete db.compareStrings
        // eslint-disable-next-line n/handle-callback-err
        db.find({}).sort({ name: 1 }).exec(function (err, docs) {
          docs.map(x => x.name)[0].should.equal('alpha')
          docs.map(x => x.name)[1].should.equal('charlie')
          docs.map(x => x.name)[2].should.equal('zulu')

          done()
        })
      })
    })

    it('With an empty collection', function (done) {
      waterfall([
        function (cb) {
          d.remove({}, { multi: true }, function (err) { return cb(err) })
        },
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 })
          cursor.exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(0)
            cb()
          })
        }
      ], done)
    })

    it('Ability to chain sorting and exec', function (done) {
      let i
      waterfall([
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).exec(function (err, docs) {
            assert.isNull(err)
            // Results are in ascending order
            for (i = 0; i < docs.length - 1; i += 1) {
              assert(docs[i].age < docs[i + 1].age)
            }
            cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: -1 }).exec(function (err, docs) {
            assert.isNull(err)
            // Results are in descending order
            for (i = 0; i < docs.length - 1; i += 1) {
              assert(docs[i].age > docs[i + 1].age)
            }
            cb()
          })
        }
      ], done)
    })

    it('Using limit and sort', function (done) {
      waterfall([
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).limit(3).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(3)
            docs[0].age.should.equal(5)
            docs[1].age.should.equal(23)
            docs[2].age.should.equal(52)
            cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: -1 }).limit(2).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(2)
            docs[0].age.should.equal(89)
            docs[1].age.should.equal(57)
            cb()
          })
        }
      ], done)
    })

    it('Using a limit higher than total number of docs shouldnt cause an error', function (done) {
      waterfall([
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).limit(7).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(5)
            docs[0].age.should.equal(5)
            docs[1].age.should.equal(23)
            docs[2].age.should.equal(52)
            docs[3].age.should.equal(57)
            docs[4].age.should.equal(89)
            cb()
          })
        }
      ], done)
    })

    it('Using limit and skip with sort', function (done) {
      waterfall([
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).limit(1).skip(2).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(1)
            docs[0].age.should.equal(52)
            cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).limit(3).skip(1).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(3)
            docs[0].age.should.equal(23)
            docs[1].age.should.equal(52)
            docs[2].age.should.equal(57)
            cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: -1 }).limit(2).skip(2).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(2)
            docs[0].age.should.equal(52)
            docs[1].age.should.equal(23)
            cb()
          })
        }
      ], done)
    })

    it('Using too big a limit and a skip with sort', function (done) {
      waterfall([
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).limit(8).skip(2).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(3)
            docs[0].age.should.equal(52)
            docs[1].age.should.equal(57)
            docs[2].age.should.equal(89)
            cb()
          })
        }
      ], done)
    })

    it('Using too big a skip with sort should return no result', function (done) {
      waterfall([
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).skip(5).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(0)
            cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).skip(7).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(0)
            cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).limit(3).skip(7).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(0)
            cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d)
          cursor.sort({ age: 1 }).limit(6).skip(7).exec(function (err, docs) {
            assert.isNull(err)
            docs.length.should.equal(0)
            cb()
          })
        }
      ], done)
    })

    it('Sorting strings', function (done) {
      waterfall([
        function (cb) {
          d.remove({}, { multi: true }, function (err) {
            if (err) { return cb(err) }

            d.insert({ name: 'jako' }, function () {
              d.insert({ name: 'jakeb' }, function () {
                d.insert({ name: 'sue' }, function () {
                  return cb()
                })
              })
            })
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ name: 1 }).exec(function (err, docs) {
            docs.length.should.equal(3)
            docs[0].name.should.equal('jakeb')
            docs[1].name.should.equal('jako')
            docs[2].name.should.equal('sue')
            return cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ name: -1 }).exec(function (err, docs) {
            docs.length.should.equal(3)
            docs[0].name.should.equal('sue')
            docs[1].name.should.equal('jako')
            docs[2].name.should.equal('jakeb')
            return cb()
          })
        }
      ], done)
    })

    it('Sorting nested fields with dates', function (done) {
      let doc1
      let doc2
      let doc3

      waterfall([
        function (cb) {
          d.remove({}, { multi: true }, function (err) {
            if (err) { return cb(err) }

            // eslint-disable-next-line n/handle-callback-err
            d.insert({ event: { recorded: new Date(400) } }, function (err, _doc1) {
              doc1 = _doc1
              // eslint-disable-next-line n/handle-callback-err
              d.insert({ event: { recorded: new Date(60000) } }, function (err, _doc2) {
                doc2 = _doc2
                // eslint-disable-next-line n/handle-callback-err
                d.insert({ event: { recorded: new Date(32) } }, function (err, _doc3) {
                  doc3 = _doc3
                  return cb()
                })
              })
            })
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ 'event.recorded': 1 }).exec(function (err, docs) {
            docs.length.should.equal(3)
            docs[0]._id.should.equal(doc3._id)
            docs[1]._id.should.equal(doc1._id)
            docs[2]._id.should.equal(doc2._id)
            return cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ 'event.recorded': -1 }).exec(function (err, docs) {
            docs.length.should.equal(3)
            docs[0]._id.should.equal(doc2._id)
            docs[1]._id.should.equal(doc1._id)
            docs[2]._id.should.equal(doc3._id)
            return cb()
          })
        }
      ], done)
    })

    it('Sorting when some fields are undefined', function (done) {
      waterfall([
        function (cb) {
          d.remove({}, { multi: true }, function (err) {
            if (err) { return cb(err) }

            d.insert({ name: 'jako', other: 2 }, function () {
              d.insert({ name: 'jakeb', other: 3 }, function () {
                d.insert({ name: 'sue' }, function () {
                  d.insert({ name: 'henry', other: 4 }, function () {
                    return cb()
                  })
                })
              })
            })
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ other: 1 }).exec(function (err, docs) {
            docs.length.should.equal(4)
            docs[0].name.should.equal('sue')
            assert.isUndefined(docs[0].other)
            docs[1].name.should.equal('jako')
            docs[1].other.should.equal(2)
            docs[2].name.should.equal('jakeb')
            docs[2].other.should.equal(3)
            docs[3].name.should.equal('henry')
            docs[3].other.should.equal(4)
            return cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d, { name: { $in: ['suzy', 'jakeb', 'jako'] } })
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ other: -1 }).exec(function (err, docs) {
            docs.length.should.equal(2)
            docs[0].name.should.equal('jakeb')
            docs[0].other.should.equal(3)
            docs[1].name.should.equal('jako')
            docs[1].other.should.equal(2)
            return cb()
          })
        }
      ], done)
    })

    it('Sorting when all fields are undefined', function (done) {
      waterfall([
        function (cb) {
          d.remove({}, { multi: true }, function (err) {
            if (err) { return cb(err) }

            d.insert({ name: 'jako' }, function () {
              d.insert({ name: 'jakeb' }, function () {
                d.insert({ name: 'sue' }, function () {
                  return cb()
                })
              })
            })
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ other: 1 }).exec(function (err, docs) {
            docs.length.should.equal(3)
            return cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d, { name: { $in: ['sue', 'jakeb', 'jakob'] } })
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ other: -1 }).exec(function (err, docs) {
            docs.length.should.equal(2)
            return cb()
          })
        }
      ], done)
    })

    it('Multiple consecutive sorts', function (done) {
      waterfall([
        function (cb) {
          d.remove({}, { multi: true }, function (err) {
            if (err) { return cb(err) }

            d.insert({ name: 'jako', age: 43, nid: 1 }, function () {
              d.insert({ name: 'jakeb', age: 43, nid: 2 }, function () {
                d.insert({ name: 'sue', age: 12, nid: 3 }, function () {
                  d.insert({ name: 'zoe', age: 23, nid: 4 }, function () {
                    d.insert({ name: 'jako', age: 35, nid: 5 }, function () {
                      return cb()
                    })
                  })
                })
              })
            })
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ name: 1, age: -1 }).exec(function (err, docs) {
            docs.length.should.equal(5)

            docs[0].nid.should.equal(2)
            docs[1].nid.should.equal(1)
            docs[2].nid.should.equal(5)
            docs[3].nid.should.equal(3)
            docs[4].nid.should.equal(4)
            return cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ name: 1, age: 1 }).exec(function (err, docs) {
            docs.length.should.equal(5)

            docs[0].nid.should.equal(2)
            docs[1].nid.should.equal(5)
            docs[2].nid.should.equal(1)
            docs[3].nid.should.equal(3)
            docs[4].nid.should.equal(4)
            return cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ age: 1, name: 1 }).exec(function (err, docs) {
            docs.length.should.equal(5)

            docs[0].nid.should.equal(3)
            docs[1].nid.should.equal(4)
            docs[2].nid.should.equal(5)
            docs[3].nid.should.equal(2)
            docs[4].nid.should.equal(1)
            return cb()
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ age: 1, name: -1 }).exec(function (err, docs) {
            docs.length.should.equal(5)

            docs[0].nid.should.equal(3)
            docs[1].nid.should.equal(4)
            docs[2].nid.should.equal(5)
            docs[3].nid.should.equal(1)
            docs[4].nid.should.equal(2)
            return cb()
          })
        }
      ], done)
    })

    it('Similar data, multiple consecutive sorts', function (done) {
      let i
      let j
      let id
      const companies = ['acme', 'milkman', 'zoinks']
      const entities = []

      waterfall([
        function (cb) {
          d.remove({}, { multi: true }, function (err) {
            if (err) { return cb(err) }

            id = 1
            for (i = 0; i < companies.length; i++) {
              for (j = 5; j <= 100; j += 5) {
                entities.push({
                  company: companies[i],
                  cost: j,
                  nid: id
                })
                id++
              }
            }

            each(entities, function (entity, callback) {
              d.insert(entity, function () {
                callback()
              })
            }, // eslint-disable-next-line n/handle-callback-err
            function (err) {
              return cb()
            })
          })
        },
        function (cb) {
          const cursor = new Cursor(d, {})
          // eslint-disable-next-line n/handle-callback-err
          cursor.sort({ company: 1, cost: 1 }).exec(function (err, docs) {
            docs.length.should.equal(60)

            for (let i = 0; i < docs.length; i++) {
              docs[i].nid.should.equal(i + 1)
            }

            return cb()
          })
        }
      ], done)
    })
  }) // ===== End of 'Sorting' =====

  describe('Projections', function () {
    let doc1
    let doc2
    let doc3
    let doc4
    let doc0

    beforeEach(function (done) {
      // We don't know the order in which docs wil be inserted but we ensure correctness by testing both sort orders
      // eslint-disable-next-line n/handle-callback-err
      d.insert({ age: 5, name: 'Jo', planet: 'B', toys: { bebe: true, ballon: 'much' } }, function (err, _doc0) {
        doc0 = _doc0
        // eslint-disable-next-line n/handle-callback-err
        d.insert({ age: 57, name: 'Louis', planet: 'R', toys: { ballon: 'yeah', bebe: false } }, function (err, _doc1) {
          doc1 = _doc1
          // eslint-disable-next-line n/handle-callback-err
          d.insert({ age: 52, name: 'Grafitti', planet: 'C', toys: { bebe: 'kind of' } }, function (err, _doc2) {
            doc2 = _doc2
            // eslint-disable-next-line n/handle-callback-err
            d.insert({ age: 23, name: 'LM', planet: 'S' }, function (err, _doc3) {
              doc3 = _doc3
              // eslint-disable-next-line n/handle-callback-err
              d.insert({ age: 89, planet: 'Earth' }, function (err, _doc4) {
                doc4 = _doc4
                return done()
              })
            })
          })
        })
      })
    })

    it('Takes all results if no projection or empty object given', function (done) {
      const cursor = new Cursor(d, {})
      cursor.sort({ age: 1 }) // For easier finding
      cursor.exec(function (err, docs) {
        assert.isNull(err)
        docs.length.should.equal(5)
        assert.deepStrictEqual(docs[0], doc0)
        assert.deepStrictEqual(docs[1], doc3)
        assert.deepStrictEqual(docs[2], doc2)
        assert.deepStrictEqual(docs[3], doc1)
        assert.deepStrictEqual(docs[4], doc4)

        cursor.projection({})
        cursor.exec(function (err, docs) {
          assert.isNull(err)
          docs.length.should.equal(5)
          assert.deepStrictEqual(docs[0], doc0)
          assert.deepStrictEqual(docs[1], doc3)
          assert.deepStrictEqual(docs[2], doc2)
          assert.deepStrictEqual(docs[3], doc1)
          assert.deepStrictEqual(docs[4], doc4)

          done()
        })
      })
    })

    it('Can take only the expected fields', function (done) {
      const cursor = new Cursor(d, {})
      cursor.sort({ age: 1 }) // For easier finding
      cursor.projection({ age: 1, name: 1 })
      cursor.exec(function (err, docs) {
        assert.isNull(err)
        docs.length.should.equal(5)
        // Takes the _id by default
        assert.deepStrictEqual(docs[0], { age: 5, name: 'Jo', _id: doc0._id })
        assert.deepStrictEqual(docs[1], { age: 23, name: 'LM', _id: doc3._id })
        assert.deepStrictEqual(docs[2], { age: 52, name: 'Grafitti', _id: doc2._id })
        assert.deepStrictEqual(docs[3], { age: 57, name: 'Louis', _id: doc1._id })
        assert.deepStrictEqual(docs[4], { age: 89, _id: doc4._id }) // No problems if one field to take doesn't exist

        cursor.projection({ age: 1, name: 1, _id: 0 })
        cursor.exec(function (err, docs) {
          assert.isNull(err)
          docs.length.should.equal(5)
          assert.deepStrictEqual(docs[0], { age: 5, name: 'Jo' })
          assert.deepStrictEqual(docs[1], { age: 23, name: 'LM' })
          assert.deepStrictEqual(docs[2], { age: 52, name: 'Grafitti' })
          assert.deepStrictEqual(docs[3], { age: 57, name: 'Louis' })
          assert.deepStrictEqual(docs[4], { age: 89 }) // No problems if one field to take doesn't exist

          done()
        })
      })
    })

    it('Can omit only the expected fields', function (done) {
      const cursor = new Cursor(d, {})
      cursor.sort({ age: 1 }) // For easier finding
      cursor.projection({ age: 0, name: 0 })
      cursor.exec(function (err, docs) {
        assert.isNull(err)
        docs.length.should.equal(5)
        // Takes the _id by default
        assert.deepStrictEqual(docs[0], { planet: 'B', _id: doc0._id, toys: { bebe: true, ballon: 'much' } })
        assert.deepStrictEqual(docs[1], { planet: 'S', _id: doc3._id })
        assert.deepStrictEqual(docs[2], { planet: 'C', _id: doc2._id, toys: { bebe: 'kind of' } })
        assert.deepStrictEqual(docs[3], { planet: 'R', _id: doc1._id, toys: { bebe: false, ballon: 'yeah' } })
        assert.deepStrictEqual(docs[4], { planet: 'Earth', _id: doc4._id })

        cursor.projection({ age: 0, name: 0, _id: 0 })
        cursor.exec(function (err, docs) {
          assert.isNull(err)
          docs.length.should.equal(5)
          assert.deepStrictEqual(docs[0], { planet: 'B', toys: { bebe: true, ballon: 'much' } })
          assert.deepStrictEqual(docs[1], { planet: 'S' })
          assert.deepStrictEqual(docs[2], { planet: 'C', toys: { bebe: 'kind of' } })
          assert.deepStrictEqual(docs[3], { planet: 'R', toys: { bebe: false, ballon: 'yeah' } })
          assert.deepStrictEqual(docs[4], { planet: 'Earth' })

          done()
        })
      })
    })

    it('Cannot use both modes except for _id', function (done) {
      const cursor = new Cursor(d, {})
      cursor.sort({ age: 1 }) // For easier finding
      cursor.projection({ age: 1, name: 0 })
      cursor.exec(function (err, docs) {
        assert.isNotNull(err)
        assert.isUndefined(docs)

        cursor.projection({ age: 1, _id: 0 })
        cursor.exec(function (err, docs) {
          assert.isNull(err)
          assert.deepStrictEqual(docs[0], { age: 5 })
          assert.deepStrictEqual(docs[1], { age: 23 })
          assert.deepStrictEqual(docs[2], { age: 52 })
          assert.deepStrictEqual(docs[3], { age: 57 })
          assert.deepStrictEqual(docs[4], { age: 89 })

          cursor.projection({ age: 0, toys: 0, planet: 0, _id: 1 })
          cursor.exec(function (err, docs) {
            assert.isNull(err)
            assert.deepStrictEqual(docs[0], { name: 'Jo', _id: doc0._id })
            assert.deepStrictEqual(docs[1], { name: 'LM', _id: doc3._id })
            assert.deepStrictEqual(docs[2], { name: 'Grafitti', _id: doc2._id })
            assert.deepStrictEqual(docs[3], { name: 'Louis', _id: doc1._id })
            assert.deepStrictEqual(docs[4], { _id: doc4._id })

            done()
          })
        })
      })
    })

    it('Projections on embedded documents - omit type', function (done) {
      const cursor = new Cursor(d, {})
      cursor.sort({ age: 1 }) // For easier finding
      cursor.projection({ name: 0, planet: 0, 'toys.bebe': 0, _id: 0 })
      // eslint-disable-next-line n/handle-callback-err
      cursor.exec(function (err, docs) {
        assert.deepStrictEqual(docs[0], { age: 5, toys: { ballon: 'much' } })
        assert.deepStrictEqual(docs[1], { age: 23 })
        assert.deepStrictEqual(docs[2], { age: 52, toys: {} })
        assert.deepStrictEqual(docs[3], { age: 57, toys: { ballon: 'yeah' } })
        assert.deepStrictEqual(docs[4], { age: 89 })

        done()
      })
    })

    it('Projections on embedded documents - pick type', function (done) {
      const cursor = new Cursor(d, {})
      cursor.sort({ age: 1 }) // For easier finding
      cursor.projection({ name: 1, 'toys.ballon': 1, _id: 0 })
      // eslint-disable-next-line n/handle-callback-err
      cursor.exec(function (err, docs) {
        assert.deepStrictEqual(docs[0], { name: 'Jo', toys: { ballon: 'much' } })
        assert.deepStrictEqual(docs[1], { name: 'LM' })
        assert.deepStrictEqual(docs[2], { name: 'Grafitti' })
        assert.deepStrictEqual(docs[3], { name: 'Louis', toys: { ballon: 'yeah' } })
        assert.deepStrictEqual(docs[4], {})

        done()
      })
    })
  }) // ==== End of 'Projections' ====
})
