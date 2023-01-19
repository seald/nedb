/* eslint-env mocha */
const Index = require('../lib/indexes')
const chai = require('chai')

const { assert } = chai
chai.should()

describe('Indexes', function () {
  describe('Insertion', function () {
    it('Can insert pointers to documents in the index correctly when they have the field', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      // The underlying BST now has 3 nodes which contain the docs where it's expected
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('hello'), [{ a: 5, tf: 'hello' }])
      assert.deepStrictEqual(idx.tree.search('world'), [{ a: 8, tf: 'world' }])
      assert.deepStrictEqual(idx.tree.search('bloup'), [{ a: 2, tf: 'bloup' }])

      // The nodes contain pointers to the actual documents
      idx.tree.search('world')[0].should.equal(doc2)
      idx.tree.search('bloup')[0].a = 42
      doc3.a.should.equal(42)
    })

    it('Can insert pointers to documents in the index correctly when they have compound fields', function () {
      const idx = new Index({ fieldName: 'tf,tg' })
      const doc1 = { a: 5, tf: 'hello', tg: 'world' }
      const doc2 = { a: 8, tf: 'hello', tg: 'bloup' }
      const doc3 = { a: 2, tf: 'bloup', tg: 'bloup' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      // The underlying BST now has 3 nodes which contain the docs where it's expected
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepEqual(idx.tree.search({ tf: 'hello', tg: 'world' }), [{ a: 5, tf: 'hello', tg: 'world' }])
      assert.deepEqual(idx.tree.search({ tf: 'hello', tg: 'bloup' }), [{ a: 8, tf: 'hello', tg: 'bloup' }])
      assert.deepEqual(idx.tree.search({ tf: 'bloup', tg: 'bloup' }), [{ a: 2, tf: 'bloup', tg: 'bloup' }])

      // The nodes contain pointers to the actual documents
      idx.tree.search({ tf: 'hello', tg: 'bloup' })[0].should.equal(doc2)
      idx.tree.search({ tf: 'bloup', tg: 'bloup' })[0].a = 42
      doc3.a.should.equal(42)
    })

    it('Inserting twice for the same fieldName in a unique index will result in an error thrown', function () {
      const idx = new Index({ fieldName: 'tf', unique: true })
      const doc1 = { a: 5, tf: 'hello' }

      idx.insert(doc1)
      idx.tree.getNumberOfKeys().should.equal(1);
      (function () { idx.insert(doc1) }).should.throw()
    })

    it('Inserting twice for a fieldName the docs dont have with a unique index results in an error thrown', function () {
      const idx = new Index({ fieldName: 'nope', unique: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 5, tf: 'world' }

      idx.insert(doc1)
      idx.tree.getNumberOfKeys().should.equal(1);
      (function () { idx.insert(doc2) }).should.throw()
    })

    it('Inserting twice for a fieldName the docs dont have with a unique and sparse index will not throw, since the docs will be non indexed', function () {
      const idx = new Index({ fieldName: 'nope', unique: true, sparse: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 5, tf: 'world' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.tree.getNumberOfKeys().should.equal(0) // Docs are not indexed
    })

    it('Inserting twice for the same compound fieldName in a unique index will result in an error thrown', function () {
      const idx = new Index({ fieldName: 'tf,tg', unique: true })
      const doc1 = { a: 5, tf: 'hello', tg: 'world' }

      idx.insert(doc1)
      idx.tree.getNumberOfKeys().should.equal(1);
      (function () { idx.insert(doc1) }).should.throw()
    })

    it('Inserting twice for a compound fieldName the docs dont have with a unique and sparse index will not throw, since the docs will be non indexed', function () {
      const idx = new Index({ fieldName: 'nope,nopeNope', unique: true, sparse: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 5, tf: 'world' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.tree.getNumberOfKeys().should.equal(0) // Docs are not indexed
    })

    it('Works with dot notation', function () {
      const idx = new Index({ fieldName: 'tf.nested' })
      const doc1 = { a: 5, tf: { nested: 'hello' } }
      const doc2 = { a: 8, tf: { nested: 'world', additional: true } }
      const doc3 = { a: 2, tf: { nested: 'bloup', age: 42 } }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      // The underlying BST now has 3 nodes which contain the docs where it's expected
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('hello'), [doc1])
      assert.deepStrictEqual(idx.tree.search('world'), [doc2])
      assert.deepStrictEqual(idx.tree.search('bloup'), [doc3])

      // The nodes contain pointers to the actual documents
      idx.tree.search('bloup')[0].a = 42
      doc3.a.should.equal(42)
    })

    it('Can insert an array of documents', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }

      idx.insert([doc1, doc2, doc3])
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('hello'), [doc1])
      assert.deepStrictEqual(idx.tree.search('world'), [doc2])
      assert.deepStrictEqual(idx.tree.search('bloup'), [doc3])
    })

    it('When inserting an array of elements, if an error is thrown all inserts need to be rolled back', function () {
      const idx = new Index({ fieldName: 'tf', unique: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc2b = { a: 84, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }

      try {
        idx.insert([doc1, doc2, doc2b, doc3])
      } catch (e) {
        e.errorType.should.equal('uniqueViolated')
      }
      idx.tree.getNumberOfKeys().should.equal(0)
      assert.deepStrictEqual(idx.tree.search('hello'), [])
      assert.deepStrictEqual(idx.tree.search('world'), [])
      assert.deepStrictEqual(idx.tree.search('bloup'), [])
    })

    describe('Array fields', function () {
      it('Inserts one entry per array element in the index', function () {
        const obj = { tf: ['aa', 'bb'], really: 'yeah' }
        const obj2 = { tf: 'normal', yes: 'indeed' }
        const idx = new Index({ fieldName: 'tf' })

        idx.insert(obj)
        idx.getAll().length.should.equal(2)
        idx.getAll()[0].should.equal(obj)
        idx.getAll()[1].should.equal(obj)

        idx.insert(obj2)
        idx.getAll().length.should.equal(3)
      })

      it('Inserts one entry per array element in the index, type-checked', function () {
        const obj = { tf: ['42', 42, new Date(42), 42], really: 'yeah' }
        const idx = new Index({ fieldName: 'tf' })

        idx.insert(obj)
        idx.getAll().length.should.equal(3)
        idx.getAll()[0].should.equal(obj)
        idx.getAll()[1].should.equal(obj)
        idx.getAll()[2].should.equal(obj)
      })

      it('Inserts one entry per unique array element in the index, the unique constraint only holds across documents', function () {
        const obj = { tf: ['aa', 'aa'], really: 'yeah' }
        const obj2 = { tf: ['cc', 'yy', 'cc'], yes: 'indeed' }
        const idx = new Index({ fieldName: 'tf', unique: true })

        idx.insert(obj)
        idx.getAll().length.should.equal(1)
        idx.getAll()[0].should.equal(obj)

        idx.insert(obj2)
        idx.getAll().length.should.equal(3)
      })

      it('The unique constraint holds across documents', function () {
        const obj = { tf: ['aa', 'aa'], really: 'yeah' }
        const obj2 = { tf: ['cc', 'aa', 'cc'], yes: 'indeed' }
        const idx = new Index({ fieldName: 'tf', unique: true })

        idx.insert(obj)
        idx.getAll().length.should.equal(1)
        idx.getAll()[0].should.equal(obj);

        (function () { idx.insert(obj2) }).should.throw()
      })

      it('When removing a document, remove it from the index at all unique array elements', function () {
        const obj = { tf: ['aa', 'aa'], really: 'yeah' }
        const obj2 = { tf: ['cc', 'aa', 'cc'], yes: 'indeed' }
        const idx = new Index({ fieldName: 'tf' })

        idx.insert(obj)
        idx.insert(obj2)
        idx.getMatching('aa').length.should.equal(2)
        idx.getMatching('aa').indexOf(obj).should.not.equal(-1)
        idx.getMatching('aa').indexOf(obj2).should.not.equal(-1)
        idx.getMatching('cc').length.should.equal(1)

        idx.remove(obj2)
        idx.getMatching('aa').length.should.equal(1)
        idx.getMatching('aa').indexOf(obj).should.not.equal(-1)
        idx.getMatching('aa').indexOf(obj2).should.equal(-1)
        idx.getMatching('cc').length.should.equal(0)
      })

      it('If a unique constraint is violated when inserting an array key, roll back all inserts before the key', function () {
        const obj = { tf: ['aa', 'bb'], really: 'yeah' }
        const obj2 = { tf: ['cc', 'dd', 'aa', 'ee'], yes: 'indeed' }
        const idx = new Index({ fieldName: 'tf', unique: true })

        idx.insert(obj)
        idx.getAll().length.should.equal(2)
        idx.getMatching('aa').length.should.equal(1)
        idx.getMatching('bb').length.should.equal(1)
        idx.getMatching('cc').length.should.equal(0)
        idx.getMatching('dd').length.should.equal(0)
        idx.getMatching('ee').length.should.equal(0);

        (function () { idx.insert(obj2) }).should.throw()
        idx.getAll().length.should.equal(2)
        idx.getMatching('aa').length.should.equal(1)
        idx.getMatching('bb').length.should.equal(1)
        idx.getMatching('cc').length.should.equal(0)
        idx.getMatching('dd').length.should.equal(0)
        idx.getMatching('ee').length.should.equal(0)
      })
    }) // ==== End of 'Array fields' ==== //

    describe('Compound Indexes', function () {
      it('Supports field names separated by commas', function () {
        const idx = new Index({ fieldName: 'tf,tf2' })
        const doc1 = { a: 5, tf: 'hello', tf2: 7 }
        const doc2 = { a: 8, tf: 'hello', tf2: 6 }
        const doc3 = { a: 2, tf: 'bloup', tf2: 3 }

        idx.insert(doc1)
        idx.insert(doc2)
        idx.insert(doc3)

        // The underlying BST now has 3 nodes which contain the docs where it's expected
        idx.tree.getNumberOfKeys().should.equal(3)
        assert.deepEqual(idx.tree.search({ tf: 'hello', tf2: 7 }), [{ a: 5, tf: 'hello', tf2: 7 }])
        assert.deepEqual(idx.tree.search({ tf: 'hello', tf2: 6 }), [{ a: 8, tf: 'hello', tf2: 6 }])
        assert.deepEqual(idx.tree.search({ tf: 'bloup', tf2: 3 }), [{ a: 2, tf: 'bloup', tf2: 3 }])

        // The nodes contain pointers to the actual documents
        idx.tree.search({ tf: 'hello', tf2: 6 })[0].should.equal(doc2)
        idx.tree.search({ tf: 'bloup', tf2: 3 })[0].a = 42
        doc3.a.should.equal(42)
      })
    })
  }) // ==== End of 'Insertion' ==== //

  describe('Removal', function () {
    it('Can remove pointers from the index, even when multiple documents have the same key', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const doc4 = { a: 23, tf: 'world' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.insert(doc4)
      idx.tree.getNumberOfKeys().should.equal(3)

      idx.remove(doc1)
      idx.tree.getNumberOfKeys().should.equal(2)
      idx.tree.search('hello').length.should.equal(0)

      idx.remove(doc2)
      idx.tree.getNumberOfKeys().should.equal(2)
      idx.tree.search('world').length.should.equal(1)
      idx.tree.search('world')[0].should.equal(doc4)
    })

    it('If we have a sparse index, removing a non indexed doc has no effect', function () {
      const idx = new Index({ fieldName: 'nope', sparse: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 5, tf: 'world' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.tree.getNumberOfKeys().should.equal(0)

      idx.remove(doc1)
      idx.tree.getNumberOfKeys().should.equal(0)
    })

    it('Works with dot notation', function () {
      const idx = new Index({ fieldName: 'tf.nested' })
      const doc1 = { a: 5, tf: { nested: 'hello' } }
      const doc2 = { a: 8, tf: { nested: 'world', additional: true } }
      const doc3 = { a: 2, tf: { nested: 'bloup', age: 42 } }
      const doc4 = { a: 2, tf: { nested: 'world', fruits: ['apple', 'carrot'] } }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.insert(doc4)
      idx.tree.getNumberOfKeys().should.equal(3)

      idx.remove(doc1)
      idx.tree.getNumberOfKeys().should.equal(2)
      idx.tree.search('hello').length.should.equal(0)

      idx.remove(doc2)
      idx.tree.getNumberOfKeys().should.equal(2)
      idx.tree.search('world').length.should.equal(1)
      idx.tree.search('world')[0].should.equal(doc4)
    })

    it('Can remove an array of documents', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }

      idx.insert([doc1, doc2, doc3])
      idx.tree.getNumberOfKeys().should.equal(3)
      idx.remove([doc1, doc3])
      idx.tree.getNumberOfKeys().should.equal(1)
      assert.deepStrictEqual(idx.tree.search('hello'), [])
      assert.deepStrictEqual(idx.tree.search('world'), [doc2])
      assert.deepStrictEqual(idx.tree.search('bloup'), [])
    })
  }) // ==== End of 'Removal' ==== //

  describe('Update', function () {
    it('Can update a document whose key did or didnt change', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const doc4 = { a: 23, tf: 'world' }
      const doc5 = { a: 1, tf: 'changed' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('world'), [doc2])

      idx.update(doc2, doc4)
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('world'), [doc4])

      idx.update(doc1, doc5)
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('hello'), [])
      assert.deepStrictEqual(idx.tree.search('changed'), [doc5])
    })

    it('If a simple update violates a unique constraint, changes are rolled back and an error thrown', function () {
      const idx = new Index({ fieldName: 'tf', unique: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const bad = { a: 23, tf: 'world' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('hello'), [doc1])
      assert.deepStrictEqual(idx.tree.search('world'), [doc2])
      assert.deepStrictEqual(idx.tree.search('bloup'), [doc3])

      try {
        idx.update(doc3, bad)
      } catch (e) {
        e.errorType.should.equal('uniqueViolated')
      }

      // No change
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('hello'), [doc1])
      assert.deepStrictEqual(idx.tree.search('world'), [doc2])
      assert.deepStrictEqual(idx.tree.search('bloup'), [doc3])
    })

    it('Can update an array of documents', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const doc1b = { a: 23, tf: 'world' }
      const doc2b = { a: 1, tf: 'changed' }
      const doc3b = { a: 44, tf: 'bloup' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.tree.getNumberOfKeys().should.equal(3)

      idx.update([{ oldDoc: doc1, newDoc: doc1b }, { oldDoc: doc2, newDoc: doc2b }, { oldDoc: doc3, newDoc: doc3b }])

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('world').length.should.equal(1)
      idx.getMatching('world')[0].should.equal(doc1b)
      idx.getMatching('changed').length.should.equal(1)
      idx.getMatching('changed')[0].should.equal(doc2b)
      idx.getMatching('bloup').length.should.equal(1)
      idx.getMatching('bloup')[0].should.equal(doc3b)
    })

    it('If a unique constraint is violated during an array-update, all changes are rolled back and an error thrown', function () {
      const idx = new Index({ fieldName: 'tf', unique: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const doc1b = { a: 23, tf: 'changed' }
      const doc2b = { a: 1, tf: 'changed' }
      const doc3b = { a: 44, tf: 'alsochanged' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.tree.getNumberOfKeys().should.equal(3)

      try {
        idx.update([{ oldDoc: doc1, newDoc: doc1b }, { oldDoc: doc2, newDoc: doc2b }, { oldDoc: doc3, newDoc: doc3b }])
      } catch (e) {
        e.errorType.should.equal('uniqueViolated')
      }

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('hello').length.should.equal(1)
      idx.getMatching('hello')[0].should.equal(doc1)
      idx.getMatching('world').length.should.equal(1)
      idx.getMatching('world')[0].should.equal(doc2)
      idx.getMatching('bloup').length.should.equal(1)
      idx.getMatching('bloup')[0].should.equal(doc3)

      try {
        idx.update([{ oldDoc: doc1, newDoc: doc1b }, { oldDoc: doc2, newDoc: doc2b }, { oldDoc: doc3, newDoc: doc3b }])
      } catch (e) {
        e.errorType.should.equal('uniqueViolated')
      }

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('hello').length.should.equal(1)
      idx.getMatching('hello')[0].should.equal(doc1)
      idx.getMatching('world').length.should.equal(1)
      idx.getMatching('world')[0].should.equal(doc2)
      idx.getMatching('bloup').length.should.equal(1)
      idx.getMatching('bloup')[0].should.equal(doc3)
    })

    it('If an update doesnt change a document, the unique constraint is not violated', function () {
      const idx = new Index({ fieldName: 'tf', unique: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const noChange = { a: 8, tf: 'world' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('world'), [doc2])

      idx.update(doc2, noChange) // No error thrown
      idx.tree.getNumberOfKeys().should.equal(3)
      assert.deepStrictEqual(idx.tree.search('world'), [noChange])
    })

    it('Can revert simple and batch updates', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const doc1b = { a: 23, tf: 'world' }
      const doc2b = { a: 1, tf: 'changed' }
      const doc3b = { a: 44, tf: 'bloup' }
      const batchUpdate = [{ oldDoc: doc1, newDoc: doc1b }, { oldDoc: doc2, newDoc: doc2b }, {
        oldDoc: doc3,
        newDoc: doc3b
      }]

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.tree.getNumberOfKeys().should.equal(3)

      idx.update(batchUpdate)

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('world').length.should.equal(1)
      idx.getMatching('world')[0].should.equal(doc1b)
      idx.getMatching('changed').length.should.equal(1)
      idx.getMatching('changed')[0].should.equal(doc2b)
      idx.getMatching('bloup').length.should.equal(1)
      idx.getMatching('bloup')[0].should.equal(doc3b)

      idx.revertUpdate(batchUpdate)

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('hello').length.should.equal(1)
      idx.getMatching('hello')[0].should.equal(doc1)
      idx.getMatching('world').length.should.equal(1)
      idx.getMatching('world')[0].should.equal(doc2)
      idx.getMatching('bloup').length.should.equal(1)
      idx.getMatching('bloup')[0].should.equal(doc3)

      // Now a simple update
      idx.update(doc2, doc2b)

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('hello').length.should.equal(1)
      idx.getMatching('hello')[0].should.equal(doc1)
      idx.getMatching('changed').length.should.equal(1)
      idx.getMatching('changed')[0].should.equal(doc2b)
      idx.getMatching('bloup').length.should.equal(1)
      idx.getMatching('bloup')[0].should.equal(doc3)

      idx.revertUpdate(doc2, doc2b)

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('hello').length.should.equal(1)
      idx.getMatching('hello')[0].should.equal(doc1)
      idx.getMatching('world').length.should.equal(1)
      idx.getMatching('world')[0].should.equal(doc2)
      idx.getMatching('bloup').length.should.equal(1)
      idx.getMatching('bloup')[0].should.equal(doc3)
    })
  }) // ==== End of 'Update' ==== //

  describe('Get matching documents', function () {
    it('Get all documents where fieldName is equal to the given value, or an empty array if no match', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const doc4 = { a: 23, tf: 'world' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.insert(doc4)

      assert.deepStrictEqual(idx.getMatching('bloup'), [doc3])
      assert.deepStrictEqual(idx.getMatching('world'), [doc2, doc4])
      assert.deepStrictEqual(idx.getMatching('nope'), [])
    })

    it('Can get all documents for a given key in a unique index', function () {
      const idx = new Index({ fieldName: 'tf', unique: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      assert.deepStrictEqual(idx.getMatching('bloup'), [doc3])
      assert.deepStrictEqual(idx.getMatching('world'), [doc2])
      assert.deepStrictEqual(idx.getMatching('nope'), [])
    })

    it('Can get all documents for which a field is undefined', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 2, nottf: 'bloup' }
      const doc3 = { a: 8, tf: 'world' }
      const doc4 = { a: 7, nottf: 'yes' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      assert.deepStrictEqual(idx.getMatching('bloup'), [])
      assert.deepStrictEqual(idx.getMatching('hello'), [doc1])
      assert.deepStrictEqual(idx.getMatching('world'), [doc3])
      assert.deepStrictEqual(idx.getMatching('yes'), [])
      assert.deepStrictEqual(idx.getMatching(undefined), [doc2])

      idx.insert(doc4)

      assert.deepStrictEqual(idx.getMatching('bloup'), [])
      assert.deepStrictEqual(idx.getMatching('hello'), [doc1])
      assert.deepStrictEqual(idx.getMatching('world'), [doc3])
      assert.deepStrictEqual(idx.getMatching('yes'), [])
      assert.deepStrictEqual(idx.getMatching(undefined), [doc2, doc4])
    })

    it('Can get all documents for which a field is null', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 2, tf: null }
      const doc3 = { a: 8, tf: 'world' }
      const doc4 = { a: 7, tf: null }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      assert.deepStrictEqual(idx.getMatching('bloup'), [])
      assert.deepStrictEqual(idx.getMatching('hello'), [doc1])
      assert.deepStrictEqual(idx.getMatching('world'), [doc3])
      assert.deepStrictEqual(idx.getMatching('yes'), [])
      assert.deepStrictEqual(idx.getMatching(null), [doc2])

      idx.insert(doc4)

      assert.deepStrictEqual(idx.getMatching('bloup'), [])
      assert.deepStrictEqual(idx.getMatching('hello'), [doc1])
      assert.deepStrictEqual(idx.getMatching('world'), [doc3])
      assert.deepStrictEqual(idx.getMatching('yes'), [])
      assert.deepStrictEqual(idx.getMatching(null), [doc2, doc4])
    })

    it('Can get all documents for a given key in a sparse index, but not unindexed docs (= field undefined)', function () {
      const idx = new Index({ fieldName: 'tf', sparse: true })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 2, nottf: 'bloup' }
      const doc3 = { a: 8, tf: 'world' }
      const doc4 = { a: 7, nottf: 'yes' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.insert(doc4)

      assert.deepStrictEqual(idx.getMatching('bloup'), [])
      assert.deepStrictEqual(idx.getMatching('hello'), [doc1])
      assert.deepStrictEqual(idx.getMatching('world'), [doc3])
      assert.deepStrictEqual(idx.getMatching('yes'), [])
      assert.deepStrictEqual(idx.getMatching(undefined), [])
    })

    it('Can get all documents whose key is in an array of keys', function () {
      // For this test only we have to use objects with _ids as the array version of getMatching
      // relies on the _id property being set, otherwise we have to use a quadratic algorithm
      // or a fingerprinting algorithm, both solutions too complicated and slow given that live nedb
      // indexes documents with _id always set
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello', _id: '1' }
      const doc2 = { a: 2, tf: 'bloup', _id: '2' }
      const doc3 = { a: 8, tf: 'world', _id: '3' }
      const doc4 = { a: 7, tf: 'yes', _id: '4' }
      const doc5 = { a: 7, tf: 'yes', _id: '5' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.insert(doc4)
      idx.insert(doc5)

      assert.deepStrictEqual(idx.getMatching([]), [])
      assert.deepStrictEqual(idx.getMatching(['bloup']), [doc2])
      assert.deepStrictEqual(idx.getMatching(['bloup', 'yes']), [doc2, doc4, doc5])
      assert.deepStrictEqual(idx.getMatching(['hello', 'no']), [doc1])
      assert.deepStrictEqual(idx.getMatching(['nope', 'no']), [])
    })

    it('Can get all documents whose key is between certain bounds', function () {
      const idx = new Index({ fieldName: 'a' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 2, tf: 'bloup' }
      const doc3 = { a: 8, tf: 'world' }
      const doc4 = { a: 7, tf: 'yes' }
      const doc5 = { a: 10, tf: 'yes' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)
      idx.insert(doc4)
      idx.insert(doc5)

      assert.deepStrictEqual(idx.getBetweenBounds({ $lt: 10, $gte: 5 }), [doc1, doc4, doc3])
      assert.deepStrictEqual(idx.getBetweenBounds({ $lte: 8 }), [doc2, doc1, doc4, doc3])
      assert.deepStrictEqual(idx.getBetweenBounds({ $gt: 7 }), [doc3, doc5])
    })
  }) // ==== End of 'Get matching documents' ==== //

  describe('Resetting', function () {
    it('Can reset an index without any new data, the index will be empty afterwards', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('hello').length.should.equal(1)
      idx.getMatching('world').length.should.equal(1)
      idx.getMatching('bloup').length.should.equal(1)

      idx.reset()
      idx.tree.getNumberOfKeys().should.equal(0)
      idx.getMatching('hello').length.should.equal(0)
      idx.getMatching('world').length.should.equal(0)
      idx.getMatching('bloup').length.should.equal(0)
    })

    it('Can reset an index and initialize it with one document', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const newDoc = { a: 555, tf: 'new' }

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('hello').length.should.equal(1)
      idx.getMatching('world').length.should.equal(1)
      idx.getMatching('bloup').length.should.equal(1)

      idx.reset(newDoc)
      idx.tree.getNumberOfKeys().should.equal(1)
      idx.getMatching('hello').length.should.equal(0)
      idx.getMatching('world').length.should.equal(0)
      idx.getMatching('bloup').length.should.equal(0)
      idx.getMatching('new')[0].a.should.equal(555)
    })

    it('Can reset an index and initialize it with an array of documents', function () {
      const idx = new Index({ fieldName: 'tf' })
      const doc1 = { a: 5, tf: 'hello' }
      const doc2 = { a: 8, tf: 'world' }
      const doc3 = { a: 2, tf: 'bloup' }
      const newDocs = [{ a: 555, tf: 'new' }, { a: 666, tf: 'again' }]

      idx.insert(doc1)
      idx.insert(doc2)
      idx.insert(doc3)

      idx.tree.getNumberOfKeys().should.equal(3)
      idx.getMatching('hello').length.should.equal(1)
      idx.getMatching('world').length.should.equal(1)
      idx.getMatching('bloup').length.should.equal(1)

      idx.reset(newDocs)
      idx.tree.getNumberOfKeys().should.equal(2)
      idx.getMatching('hello').length.should.equal(0)
      idx.getMatching('world').length.should.equal(0)
      idx.getMatching('bloup').length.should.equal(0)
      idx.getMatching('new')[0].a.should.equal(555)
      idx.getMatching('again')[0].a.should.equal(666)
    })
  }) // ==== End of 'Resetting' ==== //

  it('Get all elements in the index', function () {
    const idx = new Index({ fieldName: 'a' })
    const doc1 = { a: 5, tf: 'hello' }
    const doc2 = { a: 8, tf: 'world' }
    const doc3 = { a: 2, tf: 'bloup' }

    idx.insert(doc1)
    idx.insert(doc2)
    idx.insert(doc3)

    assert.deepStrictEqual(idx.getAll(), [{ a: 2, tf: 'bloup' }, { a: 5, tf: 'hello' }, { a: 8, tf: 'world' }])
  })
})
