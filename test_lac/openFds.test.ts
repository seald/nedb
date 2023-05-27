import fs from "fs";
const fsPromises = fs.promises;
import { Datastore } from "../src/datastore";
const N = 64;

// A console.error triggers an error of the parent test

const runTest = async () => {
  let filehandles = [];
  try {
    for (let i = 0; i < 2 * N + 1; i++) {
      const filehandle = await fsPromises.open(
        "./test_lac/openFdsTestFile",
        "r"
      );
      filehandles.push(filehandle);
    }
    console.error("No error occurred while opening a file too many times");
    process.exit(1);
  } catch (error: any) {
    if (error.code !== "EMFILE") {
      console.error(error);
      process.exit(1);
    }
  } finally {
    for (const filehandle of filehandles) {
      await filehandle.close();
    }
    filehandles = [];
  }

  try {
    for (let i = 0; i < N; i++) {
      const filehandle = await fsPromises.open(
        "./test_lac/openFdsTestFile2",
        "r"
      );
      filehandles.push(filehandle);
    }
  } catch (error: any) {
    console.error(
      `An unexpected error occurred when opening file not too many times with error: ${error}`
    );
    process.exit(1);
  } finally {
    for (const filehandle of filehandles) {
      await filehandle.close();
    }
  }

  try {
    const db = new Datastore({ filename: "./workspace/openfds.db" });
    await db.loadDatabaseAsync();
    await db.removeAsync({}, { multi: true });
    await db.insertAsync({ hello: "world" });

    for (let i = 0; i < 2 * N + 1; i++) {
      await db.persistence.persistCachedDatabaseAsync();
    }
  } catch (error: any) {
    console.error(
      `Got unexpected error during one persistence operation with error: ${error}`
    );
  }
};
try {
  runTest();
} catch (error: any) {
  console.error(error);
  process.exit(1);
}
