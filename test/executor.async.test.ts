/* eslint-env mocha */
const testDb = "workspace/test.db";
const { promises: fs } = require("fs");
const assert = require("assert").strict;
const path = require("path");
const Datastore = require("../src/datastore");
const Persistence = require("../src/persistence");
const { exists } = require("./utils.test");

// Test that operations are executed in the right order
// We prevent Mocha from catching the exception we throw on purpose by remembering all current handlers, remove them and register them back after test ends
const testRightOrder = async (d) => {
  const docs = await d.findAsync({});
  assert.equal(docs.length, 0);

  await d.insertAsync({ a: 1 });
  await d.updateAsync({ a: 1 }, { a: 2 }, {});
  const docs2 = await d.findAsync({});
  assert.equal(docs2[0].a, 2);
  d.updateAsync({ a: 2 }, { a: 3 }, {}); // not awaiting
  d.executor.pushAsync(async () => {
    throw new Error("Some error");
  }); // not awaiting
  const docs3 = await d.findAsync({});
  assert.equal(docs3[0].a, 3);
};

// Note:  The following test does not have any assertion because it
// is meant to address the deprecation warning:
// (node) warning: Recursive process.nextTick detected. This will break in the next version of node. Please use setImmediate for recursive deferral.
// see
const testEventLoopStarvation = async (d) => {
  const times = 1001;
  let i = 0;
  while (i < times) {
    i++;
    d.findAsync({ bogus: "search" });
  }
  await d.findAsync({ bogus: "search" });
};

// Test that operations are executed in the right order even with no callback
const testExecutorWorksWithoutCallback = async (d) => {
  d.insertAsync({ a: 1 });
  d.insertAsync({ a: 2 });
  const docs = await d.findAsync({});
  assert.equal(docs.length, 2);
};

describe("Executor async", function() {
  describe("With persistent database", async () => {
    let d;

    beforeEach(async () => {
      d = new Datastore({ filename: testDb });
      assert.equal(d.filename, testDb);
      assert.equal(d.inMemoryOnly, false);
      await Persistence.ensureDirectoryExistsAsync(path.dirname(testDb));
      if (await exists(testDb)) await fs.unlink(testDb);
      await d.loadDatabaseAsync();
      assert.equal(d.getAllData().length, 0);
    });

    it("Operations are executed in the right order", () => testRightOrder(d));

    it("Does not starve event loop and raise warning when more than 1000 callbacks are in queue", () =>
      testEventLoopStarvation(d));

    it("Works in the right order even with no supplied callback", () =>
      testExecutorWorksWithoutCallback(d));
  });
}); // ==== End of 'With persistent database' ====

describe("With non persistent database", function() {
  let d;

  beforeEach(async () => {
    d = new Datastore({ inMemoryOnly: true });
    assert.equal(d.inMemoryOnly, true);
    await d.loadDatabaseAsync();
    assert.equal(d.getAllData().length, 0);
  });

  it("Operations are executed in the right order", () => testRightOrder(d));

  it("Works in the right order even with no supplied callback", () =>
    testExecutorWorksWithoutCallback(d));
}); // ==== End of 'With non persistent database' ====
