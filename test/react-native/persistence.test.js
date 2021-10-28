/* eslint-env jest */
// Forked from https://github.com/antoniopresto/react-native-local-mongodb/blob/93acbc8a9aaca86aed1d632855cd8b984501147b/test/persistence.test.js
const { promisify } = require('util')
const AsyncStorage = require('@react-native-async-storage/async-storage')
const DataStore = require('../../')

const getDb = async () => {
  await AsyncStorage.clear()
  const db = new DataStore({ filename: 'foo' })
  await promisify(db.loadDatabase.bind(db))()
  return db
}
it('update', async () => {
  const db = await getDb()
  const items0 = await promisify(db.find.bind(db))({})
  expect(AsyncStorage.getItem).toHaveBeenCalled()

  await promisify(db.insert.bind(db))({ name: 'Maggie' })
  await promisify(db.insert.bind(db))({ name: 'Bob' })
  expect(AsyncStorage.setItem).toHaveBeenCalled()

  const items = await promisify(db.find.bind(db))({})

  const maggie1 = await promisify(db.findOne.bind(db))({ name: 'Maggie' })
  const bob1 = await promisify(db.findOne.bind(db))({ name: 'Bob' })

  const res = await promisify(db.update.bind(db))({ name: { $in: ['Maggie', 'Bob'] } }, { $set: { age: 1 } }, { multi: true })
  const maggie2 = await promisify(db.findOne.bind(db))({ name: 'Maggie' })
  const bob2 = await promisify(db.findOne.bind(db))({ name: 'Bob' })

  expect(res).toEqual(2)
  expect(items0).toHaveLength(0)
  expect(items).toHaveLength(2)
  expect(maggie1.age).toBeUndefined()
  expect(bob1.age).toBeUndefined()
  expect(bob2.age).toEqual(1)
  expect(maggie2.age).toEqual(1)
})

it('remove', async () => {
  const db = await getDb()
  const items0 = await promisify(db.find.bind(db))({})
  expect(AsyncStorage.getItem).toHaveBeenCalled()

  await promisify(db.insert.bind(db))({ name: 'Maggie' })
  await promisify(db.insert.bind(db))({ name: 'Bob' })
  expect(AsyncStorage.setItem).toHaveBeenCalled()

  const items = await promisify(db.find.bind(db))({})

  const res = await promisify(db.remove.bind(db))({ name: { $in: ['Bob'] } }, { multi: true })
  const bob2 = await promisify(db.findOne.bind(db))({ name: 'Bob' })

  expect(res).toEqual(1)
  expect(items0).toHaveLength(0)
  expect(items).toHaveLength(2)
  expect(bob2).toBeNull()
})

it('resolve remove nonexistent', async () => {
  const db = await getDb()
  const items0 = await promisify(db.find.bind(db))({})
  expect(AsyncStorage.getItem).toHaveBeenCalled()

  await promisify(db.insert.bind(db))({ name: 'Maggie' })
  await promisify(db.insert.bind(db))({ name: 'Bob' })
  expect(AsyncStorage.setItem).toHaveBeenCalled()

  const items = await promisify(db.find.bind(db))({})

  const res = await promisify(db.remove.bind(db))({ name: 'nonexistent' }, { multi: true })
  const nonexistent = await promisify(db.findOne.bind(db))({ name: 'nonexistent' })

  expect(res).toEqual(0)
  expect(items0).toHaveLength(0)
  expect(items).toHaveLength(2)
  expect(nonexistent).toBeNull()
})

it('resolve findOne nonexistent', async () => {
  const db = await getDb()

  await promisify(db.insert.bind(db))({ name: 'Maggie' })
  await promisify(db.insert.bind(db))({ name: 'Bob' })
  expect(AsyncStorage.setItem).toHaveBeenCalled()

  const items = await promisify(db.find.bind(db))({ name: 'nonexistent' })

  const item = await promisify(db.findOne.bind(db))({ name: 'nonexistent' })

  expect(item).toBeNull()
  expect(items.length).toEqual(0)
})

it('should limit', async () => {
  const db = await getDb()
  await promisify(db.insert.bind(db))({ name: 'A' })
  await promisify(db.insert.bind(db))({ name: 'B' })
  await promisify(db.insert.bind(db))({ name: 'C' })
  await promisify(db.insert.bind(db))({ name: 'D' })
  expect(AsyncStorage.setItem).toHaveBeenCalled()

  const cursor = db.find({}).sort({ name: 1 }).skip(1).limit(2)

  const docs = await promisify(cursor.exec.bind(cursor))()
  expect(docs.length).toEqual(2)
  expect(docs[1].name).toEqual('C')
})
