/* eslint-env mocha */
const testDb = "workspace/test.db";
import { promises as fs } from "fs";
const assert = require("assert").strict;
import path from "path";
import { Datastore } from "../src/datastore";
import { Persistence } from "../src/persistence";
import { Cursor } from "../src/cursor";
import { exists } from "./utils.test";

describe("Cursor Async", function () {
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

  describe("Without sorting", function () {
    beforeEach(async () => {
      await d.insertAsync({ age: 5 });
      await d.insertAsync({ age: 57 });
      await d.insertAsync({ age: 52 });
      await d.insertAsync({ age: 23 });
      await d.insertAsync({ age: 89 });
    });

    it("Without query, an empty query or a simple query and no skip or limit", async () => {
      const cursor = new Cursor(d);
      const docs = await cursor;
      assert.equal(docs.length, 5);
      assert.equal(
        docs.filter(function (doc) {
          return doc.age === 5;
        })[0].age,
        5
      );
      assert.equal(
        docs.filter(function (doc) {
          return doc.age === 57;
        })[0].age,
        57
      );
      assert.equal(
        docs.filter(function (doc) {
          return doc.age === 52;
        })[0].age,
        52
      );
      assert.equal(
        docs.filter(function (doc) {
          return doc.age === 23;
        })[0].age,
        23
      );
      assert.equal(
        docs.filter(function (doc) {
          return doc.age === 89;
        })[0].age,
        89
      );
      const cursor2 = new Cursor(d, {});
      const docs2 = await cursor2;
      assert.equal(docs2.length, 5);
      assert.equal(
        docs2.filter(function (doc) {
          return doc.age === 5;
        })[0].age,
        5
      );
      assert.equal(
        docs2.filter(function (doc) {
          return doc.age === 57;
        })[0].age,
        57
      );
      assert.equal(
        docs2.filter(function (doc) {
          return doc.age === 52;
        })[0].age,
        52
      );
      assert.equal(
        docs2.filter(function (doc) {
          return doc.age === 23;
        })[0].age,
        23
      );
      assert.equal(
        docs2.filter(function (doc) {
          return doc.age === 89;
        })[0].age,
        89
      );
      const cursor3 = new Cursor(d, { age: { $gt: 23 } });
      const docs3 = await cursor3;
      assert.equal(docs3.length, 3);
      assert.equal(
        docs3.filter(function (doc) {
          return doc.age === 57;
        })[0].age,
        57
      );
      assert.equal(
        docs3.filter(function (doc) {
          return doc.age === 52;
        })[0].age,
        52
      );
      assert.equal(
        docs3.filter(function (doc) {
          return doc.age === 89;
        })[0].age,
        89
      );
    });

    it("With an empty collection", async () => {
      await d.removeAsync({}, { multi: true });
      const cursor = new Cursor(d);
      const docs = await cursor;
      assert.equal(docs.length, 0);
    });

    it("With a limit", async () => {
      const cursor = new Cursor(d);
      cursor.limit(3);
      const docs = await cursor;
      assert.equal(docs.length, 3);
      // No way to predict which results are returned of course ...
    });

    it("With a skip", async () => {
      const cursor = new Cursor(d);
      const docs = await cursor.skip(2);
      assert.equal(docs.length, 3);
      // No way to predict which results are returned of course ...
    });

    it("With a limit and a skip and method chaining", async () => {
      const cursor = new Cursor(d);
      cursor.limit(4).skip(3); // Only way to know that the right number of results was skipped is if limit + skip > number of results
      const docs = await cursor;
      assert.equal(docs.length, 2);
      // No way to predict which results are returned of course ...
    });
  }); // ===== End of 'Without sorting' =====

  describe("Sorting of the results", function () {
    beforeEach(async () => {
      // We don't know the order in which docs will be inserted but we ensure correctness by testing both sort orders
      await d.insertAsync({ age: 5 });
      await d.insertAsync({ age: 57 });
      await d.insertAsync({ age: 52 });
      await d.insertAsync({ age: 23 });
      await d.insertAsync({ age: 89 });
    });

    it("Using one sort", async () => {
      const cursor = new Cursor(d, {});
      cursor.sort({ age: 1 });
      const docs = await cursor;
      // Results are in ascending order
      for (let i = 0; i < docs.length - 1; i += 1) {
        assert(docs[i].age < docs[i + 1].age);
      }

      cursor.sort({ age: -1 });
      const docs2 = await cursor;
      // Results are in descending order
      for (let i = 0; i < docs2.length - 1; i += 1) {
        assert(docs2[i].age > docs2[i + 1].age);
      }
    });

    it("Sorting strings with custom string comparison function", async () => {
      const db = new Datastore({
        inMemoryOnly: true,
        autoload: true,
        compareStrings: function (a, b) {
          return a.length - b.length;
        },
      });

      await db.insertAsync({ name: "alpha" });
      await db.insertAsync({ name: "charlie" });
      await db.insertAsync({ name: "zulu" });

      const docs = await db.findAsync({}).sort({ name: 1 });
      assert.equal(docs.map((x) => x.name)[0], "zulu");
      assert.equal(docs.map((x) => x.name)[1], "alpha");
      assert.equal(docs.map((x) => x.name)[2], "charlie");

      delete db.compareStrings;
      const docs2 = await db.findAsync({}).sort({ name: 1 });
      assert.equal(docs2.map((x) => x.name)[0], "alpha");
      assert.equal(docs2.map((x) => x.name)[1], "charlie");
      assert.equal(docs2.map((x) => x.name)[2], "zulu");
    });

    it("With an empty collection", async () => {
      await d.removeAsync({}, { multi: true });
      const cursor = new Cursor(d);
      cursor.sort({ age: 1 });
      const docs = await cursor;
      assert.equal(docs.length, 0);
    });

    it("Ability to chain sorting and exec", async () => {
      const cursor = new Cursor(d);
      const docs = await cursor.sort({ age: 1 });
      // Results are in ascending order
      for (let i = 0; i < docs.length - 1; i += 1) {
        assert.ok(docs[i].age < docs[i + 1].age);
      }

      const cursor2 = new Cursor(d);
      const docs2 = await cursor2.sort({ age: -1 });
      // Results are in descending order
      for (let i = 0; i < docs2.length - 1; i += 1) {
        assert(docs2[i].age > docs2[i + 1].age);
      }
    });

    it("Using limit and sort", async () => {
      const cursor = new Cursor(d);
      const docs = await cursor.sort({ age: 1 }).limit(3);
      assert.equal(docs.length, 3);
      assert.equal(docs[0].age, 5);
      assert.equal(docs[1].age, 23);
      assert.equal(docs[2].age, 52);
      const cursor2 = new Cursor(d);
      const docs2 = await cursor2.sort({ age: -1 }).limit(2);
      assert.equal(docs2.length, 2);
      assert.equal(docs2[0].age, 89);
      assert.equal(docs2[1].age, 57);
    });

    it("Using a limit higher than total number of docs shouldn't cause an error", async () => {
      const cursor = new Cursor(d);
      const docs = await cursor.sort({ age: 1 }).limit(7);
      assert.equal(docs.length, 5);
      assert.equal(docs[0].age, 5);
      assert.equal(docs[1].age, 23);
      assert.equal(docs[2].age, 52);
      assert.equal(docs[3].age, 57);
      assert.equal(docs[4].age, 89);
    });

    it("Using limit and skip with sort", async () => {
      const cursor = new Cursor(d);
      const docs = await cursor.sort({ age: 1 }).limit(1).skip(2);
      assert.equal(docs.length, 1);
      assert.equal(docs[0].age, 52);
      const cursor2 = new Cursor(d);
      const docs2 = await cursor2.sort({ age: 1 }).limit(3).skip(1);
      assert.equal(docs2.length, 3);
      assert.equal(docs2[0].age, 23);
      assert.equal(docs2[1].age, 52);
      assert.equal(docs2[2].age, 57);
      const cursor3 = new Cursor(d);
      const docs3 = await cursor3.sort({ age: -1 }).limit(2).skip(2);
      assert.equal(docs3.length, 2);
      assert.equal(docs3[0].age, 52);
      assert.equal(docs3[1].age, 23);
    });

    it("Using too big a limit and a skip with sort", async () => {
      const cursor = new Cursor(d);
      const docs = await cursor.sort({ age: 1 }).limit(8).skip(2);
      assert.equal(docs.length, 3);
      assert.equal(docs[0].age, 52);
      assert.equal(docs[1].age, 57);
      assert.equal(docs[2].age, 89);
    });

    it("Using too big a skip with sort should return no result", async () => {
      const cursor = new Cursor(d);
      const docs = await cursor.sort({ age: 1 }).skip(5);
      assert.equal(docs.length, 0);
      const cursor2 = new Cursor(d);
      const docs2 = await cursor2.sort({ age: 1 }).skip(7);
      assert.equal(docs2.length, 0);

      const cursor3 = new Cursor(d);
      const docs3 = await cursor3.sort({ age: 1 }).limit(3).skip(7);
      assert.equal(docs3.length, 0);
      const cursor4 = new Cursor(d);
      const docs4 = await cursor4.sort({ age: 1 }).limit(6).skip(7);
      assert.equal(docs4.length, 0);
    });

    it("Sorting strings", async () => {
      await d.removeAsync({}, { multi: true });
      await d.insertAsync({ name: "jako" });
      await d.insertAsync({ name: "jakeb" });
      await d.insertAsync({ name: "sue" });

      const cursor = new Cursor(d, {});
      const docs = await cursor.sort({ name: 1 });
      assert.equal(docs.length, 3);
      assert.equal(docs[0].name, "jakeb");
      assert.equal(docs[1].name, "jako");
      assert.equal(docs[2].name, "sue");
      const cursor2 = new Cursor(d, {});
      const docs2 = await cursor2.sort({ name: -1 });
      assert.equal(docs2.length, 3);
      assert.equal(docs2[0].name, "sue");
      assert.equal(docs2[1].name, "jako");
      assert.equal(docs2[2].name, "jakeb");
    });

    it("Sorting nested fields with dates", async () => {
      await d.removeAsync({}, { multi: true });
      const doc1 = await d.insertAsync({ event: { recorded: new Date(400) } });
      const doc2 = await d.insertAsync({
        event: { recorded: new Date(60000) },
      });
      const doc3 = await d.insertAsync({ event: { recorded: new Date(32) } });
      const cursor = new Cursor(d, {});
      const docs = await cursor.sort({ "event.recorded": 1 });
      assert.equal(docs.length, 3);
      assert.equal(docs[0]._id, doc3._id);
      assert.equal(docs[1]._id, doc1._id);
      assert.equal(docs[2]._id, doc2._id);

      const cursor2 = new Cursor(d, {});
      const docs2 = await cursor2.sort({ "event.recorded": -1 });
      assert.equal(docs2.length, 3);
      assert.equal(docs2[0]._id, doc2._id);
      assert.equal(docs2[1]._id, doc1._id);
      assert.equal(docs2[2]._id, doc3._id);
    });

    it("Sorting when some fields are undefined", async () => {
      await d.removeAsync({}, { multi: true });

      await d.insertAsync({ name: "jako", other: 2 });
      await d.insertAsync({ name: "jakeb", other: 3 });
      await d.insertAsync({ name: "sue" });
      await d.insertAsync({ name: "henry", other: 4 });

      const cursor = new Cursor(d, {});
      // eslint-disable-next-line n/handle-callback-err
      const docs = await cursor.sort({ other: 1 });
      assert.equal(docs.length, 4);
      assert.equal(docs[0].name, "sue");
      assert.equal(docs[0].other, undefined);
      assert.equal(docs[1].name, "jako");
      assert.equal(docs[1].other, 2);
      assert.equal(docs[2].name, "jakeb");
      assert.equal(docs[2].other, 3);
      assert.equal(docs[3].name, "henry");
      assert.equal(docs[3].other, 4);
      const cursor2 = new Cursor(d, {
        name: { $in: ["suzy", "jakeb", "jako"] },
      });
      const docs2 = await cursor2.sort({ other: -1 });
      assert.equal(docs2.length, 2);
      assert.equal(docs2[0].name, "jakeb");
      assert.equal(docs2[0].other, 3);
      assert.equal(docs2[1].name, "jako");
      assert.equal(docs2[1].other, 2);
    });

    it("Sorting when all fields are undefined", async () => {
      await d.removeAsync({}, { multi: true });
      await d.insertAsync({ name: "jako" });
      await d.insertAsync({ name: "jakeb" });
      await d.insertAsync({ name: "sue" });
      const cursor = new Cursor(d, {});
      const docs = await cursor.sort({ other: 1 });
      assert.equal(docs.length, 3);

      const cursor2 = new Cursor(d, {
        name: { $in: ["sue", "jakeb", "jakob"] },
      });
      const docs2 = await cursor2.sort({ other: -1 });
      assert.equal(docs2.length, 2);
    });

    it("Multiple consecutive sorts", async () => {
      await d.removeAsync({}, { multi: true });

      await d.insertAsync({ name: "jako", age: 43, nid: 1 });
      await d.insertAsync({ name: "jakeb", age: 43, nid: 2 });
      await d.insertAsync({ name: "sue", age: 12, nid: 3 });
      await d.insertAsync({ name: "zoe", age: 23, nid: 4 });
      await d.insertAsync({ name: "jako", age: 35, nid: 5 });
      const cursor = new Cursor(d, {});
      // eslint-disable-next-line n/handle-callback-err
      const docs = await cursor.sort({ name: 1, age: -1 });
      assert.equal(docs.length, 5);

      assert.equal(docs[0].nid, 2);
      assert.equal(docs[1].nid, 1);
      assert.equal(docs[2].nid, 5);
      assert.equal(docs[3].nid, 3);
      assert.equal(docs[4].nid, 4);
      const cursor2 = new Cursor(d, {});
      const docs2 = await cursor2.sort({ name: 1, age: 1 });
      assert.equal(docs2.length, 5);

      assert.equal(docs2[0].nid, 2);
      assert.equal(docs2[1].nid, 5);
      assert.equal(docs2[2].nid, 1);
      assert.equal(docs2[3].nid, 3);
      assert.equal(docs2[4].nid, 4);
      const cursor3 = new Cursor(d, {});
      const docs3 = await cursor3.sort({ age: 1, name: 1 });
      assert.equal(docs3.length, 5);

      assert.equal(docs3[0].nid, 3);
      assert.equal(docs3[1].nid, 4);
      assert.equal(docs3[2].nid, 5);
      assert.equal(docs3[3].nid, 2);
      assert.equal(docs3[4].nid, 1);

      const cursor4 = new Cursor(d, {});
      const docs4 = await cursor4.sort({ age: 1, name: -1 });
      assert.equal(docs4.length, 5);

      assert.equal(docs4[0].nid, 3);
      assert.equal(docs4[1].nid, 4);
      assert.equal(docs4[2].nid, 5);
      assert.equal(docs4[3].nid, 1);
      assert.equal(docs4[4].nid, 2);
    });

    it("Similar data, multiple consecutive sorts", async () => {
      let id;
      const companies = ["acme", "milkman", "zoinks"];
      const entities = [];
      await d.removeAsync({}, { multi: true });
      id = 1;
      for (let i = 0; i < companies.length; i++) {
        for (let j = 5; j <= 100; j += 5) {
          entities.push({
            company: companies[i],
            cost: j,
            nid: id,
          });
          id++;
        }
      }
      await Promise.all(entities.map((entity) => d.insertAsync(entity)));
      const cursor = new Cursor(d, {});
      const docs = await cursor.sort({ company: 1, cost: 1 });
      assert.equal(docs.length, 60);

      for (let i = 0; i < docs.length; i++) {
        assert.equal(docs[i].nid, i + 1);
      }
    });
  }); // ===== End of 'Sorting' =====

  describe("Projections", function () {
    let doc1;
    let doc2;
    let doc3;
    let doc4;
    let doc0;

    beforeEach(async () => {
      // We don't know the order in which docs will be inserted but we ensure correctness by testing both sort orders
      doc0 = await d.insertAsync({
        age: 5,
        name: "Jo",
        planet: "B",
        toys: { bebe: true, ballon: "much" },
      });
      doc1 = await d.insertAsync({
        age: 57,
        name: "Louis",
        planet: "R",
        toys: { ballon: "yeah", bebe: false },
      });
      doc2 = await d.insertAsync({
        age: 52,
        name: "Grafitti",
        planet: "C",
        toys: { bebe: "kind of" },
      });
      doc3 = await d.insertAsync({ age: 23, name: "LM", planet: "S" });
      doc4 = await d.insertAsync({ age: 89, planet: "Earth" });
    });

    it("Takes all results if no projection or empty object given", async () => {
      const cursor = new Cursor(d, {});
      cursor.sort({ age: 1 }); // For easier finding
      const docs = await cursor;
      assert.equal(docs.length, 5);
      assert.deepStrictEqual(docs[0], doc0);
      assert.deepStrictEqual(docs[1], doc3);
      assert.deepStrictEqual(docs[2], doc2);
      assert.deepStrictEqual(docs[3], doc1);
      assert.deepStrictEqual(docs[4], doc4);

      cursor.projection({});
      const docs2 = await cursor;
      assert.equal(docs2.length, 5);
      assert.deepStrictEqual(docs2[0], doc0);
      assert.deepStrictEqual(docs2[1], doc3);
      assert.deepStrictEqual(docs2[2], doc2);
      assert.deepStrictEqual(docs2[3], doc1);
      assert.deepStrictEqual(docs2[4], doc4);
    });

    it("Can take only the expected fields", async () => {
      const cursor = new Cursor(d, {});
      cursor.sort({ age: 1 }); // For easier finding
      cursor.projection({ age: 1, name: 1 });
      const docs = await cursor;
      assert.equal(docs.length, 5);
      // Takes the _id by default
      assert.deepStrictEqual(docs[0], { age: 5, name: "Jo", _id: doc0._id });
      assert.deepStrictEqual(docs[1], { age: 23, name: "LM", _id: doc3._id });
      assert.deepStrictEqual(docs[2], {
        age: 52,
        name: "Grafitti",
        _id: doc2._id,
      });
      assert.deepStrictEqual(docs[3], {
        age: 57,
        name: "Louis",
        _id: doc1._id,
      });
      assert.deepStrictEqual(docs[4], { age: 89, _id: doc4._id }); // No problems if one field to take doesn't exist

      cursor.projection({ age: 1, name: 1, _id: 0 });
      const docs2 = await cursor;
      assert.equal(docs2.length, 5);
      assert.deepStrictEqual(docs2[0], { age: 5, name: "Jo" });
      assert.deepStrictEqual(docs2[1], { age: 23, name: "LM" });
      assert.deepStrictEqual(docs2[2], { age: 52, name: "Grafitti" });
      assert.deepStrictEqual(docs2[3], { age: 57, name: "Louis" });
      assert.deepStrictEqual(docs2[4], { age: 89 }); // No problems if one field to take doesn't exist
    });

    it("Can omit only the expected fields", async () => {
      const cursor = new Cursor(d, {});
      cursor.sort({ age: 1 }); // For easier finding
      cursor.projection({ age: 0, name: 0 });
      const docs = await cursor;
      assert.equal(docs.length, 5);
      // Takes the _id by default
      assert.deepStrictEqual(docs[0], {
        planet: "B",
        _id: doc0._id,
        toys: { bebe: true, ballon: "much" },
      });
      assert.deepStrictEqual(docs[1], { planet: "S", _id: doc3._id });
      assert.deepStrictEqual(docs[2], {
        planet: "C",
        _id: doc2._id,
        toys: { bebe: "kind of" },
      });
      assert.deepStrictEqual(docs[3], {
        planet: "R",
        _id: doc1._id,
        toys: { bebe: false, ballon: "yeah" },
      });
      assert.deepStrictEqual(docs[4], { planet: "Earth", _id: doc4._id });

      cursor.projection({ age: 0, name: 0, _id: 0 });
      const docs2 = await cursor;
      assert.equal(docs2.length, 5);
      assert.deepStrictEqual(docs2[0], {
        planet: "B",
        toys: { bebe: true, ballon: "much" },
      });
      assert.deepStrictEqual(docs2[1], { planet: "S" });
      assert.deepStrictEqual(docs2[2], {
        planet: "C",
        toys: { bebe: "kind of" },
      });
      assert.deepStrictEqual(docs2[3], {
        planet: "R",
        toys: { bebe: false, ballon: "yeah" },
      });
      assert.deepStrictEqual(docs2[4], { planet: "Earth" });
    });

    it("Cannot use both modes except for _id", async () => {
      const cursor = new Cursor(d, {});
      cursor.sort({ age: 1 }); // For easier finding
      cursor.projection({ age: 1, name: 0 });
      await assert.rejects(() => cursor);

      cursor.projection({ age: 1, _id: 0 });
      const docs = await cursor;
      assert.deepStrictEqual(docs[0], { age: 5 });
      assert.deepStrictEqual(docs[1], { age: 23 });
      assert.deepStrictEqual(docs[2], { age: 52 });
      assert.deepStrictEqual(docs[3], { age: 57 });
      assert.deepStrictEqual(docs[4], { age: 89 });

      cursor.projection({ age: 0, toys: 0, planet: 0, _id: 1 });
      const docs2 = await cursor;
      assert.deepStrictEqual(docs2[0], { name: "Jo", _id: doc0._id });
      assert.deepStrictEqual(docs2[1], { name: "LM", _id: doc3._id });
      assert.deepStrictEqual(docs2[2], { name: "Grafitti", _id: doc2._id });
      assert.deepStrictEqual(docs2[3], { name: "Louis", _id: doc1._id });
      assert.deepStrictEqual(docs2[4], { _id: doc4._id });
    });

    it("Projections on embedded documents - omit type", async () => {
      const cursor = new Cursor(d, {});
      cursor.sort({ age: 1 }); // For easier finding
      cursor.projection({ name: 0, planet: 0, "toys.bebe": 0, _id: 0 });
      const docs = await cursor;
      assert.deepStrictEqual(docs[0], { age: 5, toys: { ballon: "much" } });
      assert.deepStrictEqual(docs[1], { age: 23 });
      assert.deepStrictEqual(docs[2], { age: 52, toys: {} });
      assert.deepStrictEqual(docs[3], { age: 57, toys: { ballon: "yeah" } });
      assert.deepStrictEqual(docs[4], { age: 89 });
    });

    it("Projections on embedded documents - pick type", async () => {
      const cursor = new Cursor(d, {});
      cursor.sort({ age: 1 }); // For easier finding
      cursor.projection({ name: 1, "toys.ballon": 1, _id: 0 });
      const docs = await cursor;
      assert.deepStrictEqual(docs[0], { name: "Jo", toys: { ballon: "much" } });
      assert.deepStrictEqual(docs[1], { name: "LM" });
      assert.deepStrictEqual(docs[2], { name: "Grafitti" });
      assert.deepStrictEqual(docs[3], {
        name: "Louis",
        toys: { ballon: "yeah" },
      });
      assert.deepStrictEqual(docs[4], {});
    });
  }); // ==== End of 'Projections' ====
});
