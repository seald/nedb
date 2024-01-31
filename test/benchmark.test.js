import { promisify } from 'util'
import { performance } from 'node:perf_hooks'
import Persistence from '../src/persistence.js'
import { access, unlink, constants } from 'fs/promises'
import Datastore from '../src/datastore.js'

const getRandomArray = n => {
  const res = []
  let i
  let j
  let temp

  for (i = 0; i < n; i += 1) { res[i] = i }

  for (i = n - 1; i >= 1; i -= 1) {
    j = Math.floor((i + 1) * Math.random())
    temp = res[i]
    res[i] = res[j]
    res[j] = temp
  }

  return res
}

const insertDocs = async (d, n) => {
  const order = getRandomArray(n)

  for (let i = 0; i <= n; i++) {
    await d.insertAsync({ docNumber: order[i] })
    await promisify(process.nextTick)()
  }
}

const measure = async (name, n, cb) => {
  performance.mark(`${name} start`)

  for (let i = 0; i < n; i += 1) {
    await cb(i)
  }

  performance.mark(`${name} end`)

  const { duration } = performance.measure(`${name} average duration for ${n} operations`, `${name} start`, `${name} end`)
  const opsPerSecond = Math.floor(1000 * n / duration)

  console.log(`===== RESULT (${name}) ===== ${opsPerSecond} ops/s ===== ${Math.floor(duration / n * 1000) / 1000}ms/execution`)
}

describe('Performance tests without index', function () {
  const n = 1000
  const benchDb = 'workspace/bench.db'
  let d

  before(function () {
    if (!process.argv.includes('--benchmark')) this.skip()
    else this.timeout(60000)
  })

  beforeEach('Prepare database', async () => {
    try {
      await access(benchDb, constants.F_OK)
      await unlink(benchDb)
    } catch {}
    await Persistence.ensureParentDirectoryExistsAsync(benchDb)
    d = new Datastore({ filename: benchDb })
    await d.loadDatabaseAsync()
  })

  afterEach('Clean database', async () => {
    try {
      await d.this.executor.queue.guardian
      d = null
      await access(benchDb, constants.F_OK)
      await unlink(benchDb)
    } catch {}
  })

  it('ensureIndex', async () => {
    await insertDocs(d, n)
    await measure('ensureIndex', n, async (i) => {
      d.ensureIndexAsync({ fieldName: 'docNumber' })
      delete d.indexes.docNumber
    })
  })

  it('find', async () => {
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('find', n, async (i) => {
      const docs = await d.findAsync({ docNumber: order[i] })
      if (docs.length !== 1 || docs[0].docNumber !== order[i]) throw new Error('One find didnt work')
      await promisify(process.nextTick)()
    })
  })

  it('findOne', async () => {
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('findOne', n, async (i) => {
      const doc = await d.findOneAsync({ docNumber: order[i] })
      if (doc == null || doc.docNumber !== order[i]) throw new Error('One find didnt work')
      await promisify(process.nextTick)()
    })
  })

  it('find with $in', async () => {
    await insertDocs(d, n)

    const ins = []
    const arraySize = Math.min(10, n)

    // Preparing all the $in arrays, will take some time
    for (let i = 0; i < n; i += 1) {
      ins[i] = []

      for (let j = 0; j < arraySize; j += 1) {
        ins[i].push((i + j) % n)
      }
    }

    await measure('find with $in', n, async (i) => {
      const docs = await d.findAsync({ docNumber: { $in: ins[i] } })
      if (docs.length !== arraySize) throw new Error('One find didnt work')
      await promisify(process.nextTick)()
    })
  })

  it('insert docs', async () => {
    const order = getRandomArray(n)
    await measure('insert docs', n, async (i) => {
      await d.insertAsync({ docNumber: order[i] })
      await promisify(process.nextTick)()
    })
  })

  it('load database', async () => {
    await insertDocs(d, n)
    await measure('load database', n, async (i) => {
      await d.loadDatabaseAsync()
    })
  })

  it('Insert and remove one', async () => {
    // TODO measure only remove
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('insert and remove one', n, async (i) => {
      const nr = await d.removeAsync({ docNumber: order[i] }, { multi: false })
      if (nr !== 1) throw new Error('One remove didnt work')
      await d.insertAsync({ docNumber: order[i] })
    })
  })

  it('Insert and remove one with multi option', async () => {
    // TODO measure only remove
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('insert and remove one with multi option', n, async (i) => {
      const nr = await d.removeAsync({ docNumber: order[i] }, { multi: true })
      if (nr !== 1) throw new Error('One remove didnt work')
      await d.insertAsync({ docNumber: order[i] })
    })
  })

  it('Update', async () => {
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('insert and remove one with multi option', n, async (i) => {
      const { numAffected } = await d.updateAsync({ docNumber: order[i] }, { docNumber: order[i] }, { multi: false })
      if (numAffected !== 1) throw new Error('One update didnt work')
      await d.insertAsync({ docNumber: order[i] })
    })
  })

  it('Update with multi option', async () => {
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('insert and remove one with multi option', n, async (i) => {
      const { numAffected } = await d.updateAsync({ docNumber: order[i] }, { docNumber: order[i] }, { multi: true })
      if (numAffected !== 1) throw new Error('One update didnt work')
      await d.insertAsync({ docNumber: order[i] })
    })
  })

  it('find with index', async () => {
    await d.ensureIndexAsync({ fieldName: 'docNumber' })
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('find with index', n, async (i) => {
      const docs = await d.findAsync({ docNumber: order[i] })
      if (docs.length !== 1 || docs[0].docNumber !== order[i]) throw new Error('One find didnt work')
      await promisify(process.nextTick)()
    })
  })

  it('findOne with index', async () => {
    await d.ensureIndexAsync({ fieldName: 'docNumber' })
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('findOne with index', n, async (i) => {
      const doc = await d.findOneAsync({ docNumber: order[i] })
      if (doc == null || doc.docNumber !== order[i]) throw new Error('One find didnt work')
      await promisify(process.nextTick)()
    })
  })

  it('find with $in with index', async () => {
    await d.ensureIndexAsync({ fieldName: 'docNumber' })
    await insertDocs(d, n)

    const ins = []
    const arraySize = Math.min(10, n)

    // Preparing all the $in arrays, will take some time
    for (let i = 0; i < n; i += 1) {
      ins[i] = []

      for (let j = 0; j < arraySize; j += 1) {
        ins[i].push((i + j) % n)
      }
    }

    await measure('find with $in with index', n, async (i) => {
      const docs = await d.findAsync({ docNumber: { $in: ins[i] } })
      if (docs.length !== arraySize) throw new Error('One find didnt work')
      await promisify(process.nextTick)()
    })
  })

  it('insert docs with index', async () => {
    await d.ensureIndexAsync({ fieldName: 'docNumber' })
    const order = getRandomArray(n)
    await measure('insert docs with index', n, async (i) => {
      await d.insertAsync({ docNumber: order[i] })
      await promisify(process.nextTick)()
    })
  })

  it('load database with index', async () => {
    await d.ensureIndexAsync({ fieldName: 'docNumber' })
    await insertDocs(d, n)
    await measure('load database with index', n, async (i) => {
      await d.loadDatabaseAsync()
    })
  })

  it('Insert and remove one with index', async () => {
    // TODO measure only remove
    await d.ensureIndexAsync({ fieldName: 'docNumber' })
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('insert and remove one with index', n, async (i) => {
      const nr = await d.removeAsync({ docNumber: order[i] }, { multi: false })
      if (nr !== 1) throw new Error('One remove didnt work')
      await d.insertAsync({ docNumber: order[i] })
    })
  })

  it('Insert and remove one with multi option with index', async () => {
    // TODO measure only remove
    await d.ensureIndexAsync({ fieldName: 'docNumber' })
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('insert and remove one with multi option with index', n, async (i) => {
      const nr = await d.removeAsync({ docNumber: order[i] }, { multi: true })
      if (nr !== 1) throw new Error('One remove didnt work')
      await d.insertAsync({ docNumber: order[i] })
    })
  })

  it('Update with index', async () => {
    await d.ensureIndexAsync({ fieldName: 'docNumber' })
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('insert and remove one with multi option with index', n, async (i) => {
      const { numAffected } = await d.updateAsync({ docNumber: order[i] }, { docNumber: order[i] }, { multi: false })
      if (numAffected !== 1) throw new Error('One update didnt work')
      await d.insertAsync({ docNumber: order[i] })
    })
  })

  it('Update with multi option with index', async () => {
    await d.ensureIndexAsync({ fieldName: 'docNumber' })
    await insertDocs(d, n)
    const order = getRandomArray(n)
    await measure('insert and remove one with multi option with index', n, async (i) => {
      const { numAffected } = await d.updateAsync({ docNumber: order[i] }, { docNumber: order[i] }, { multi: true })
      if (numAffected !== 1) throw new Error('One update didnt work')
      await d.insertAsync({ docNumber: order[i] })
    })
  })
})
