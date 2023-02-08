// Type definitions for @seald-io/nedb 2.1.0
// Project: https://github.com/seald/nedb forked from https://github.com/louischatriot/nedb
// Definitions by: Timothée Rebours <https://gihub.com/tex0l>
//                 Mehdi Kouhen <https://github.com/arantes555>
//                 Stefan Steinhart <https://github.com/reppners>
//                 Anthony Nichols <https://github.com/anthonynichols>
//                 Alejandro Fernandez Haro <https://github.com/afharo>
//                 Pierre de la Martinière <https://github.com/martpie>
// TypeScript Version: 4.9

/// <reference types="node" />

import { EventEmitter } from "events";

export default Nedb;

export type Document<Schema> = Schema & {
  _id: string;
};

declare class Nedb<Schema = Record<string, any>> extends EventEmitter {
  constructor(pathOrOptions?: string | Nedb.DataStoreOptions);

  persistence: Nedb.Persistence;

  autoloadPromise: Promise<void> | null;

  loadDatabase(callback?: (err: Error | null) => void): void;

  loadDatabaseAsync(): Promise<void>;

  dropDatabase(callback?: (err: Error | null) => void): void;

  dropDatabaseAsync(): Promise<void>;

  compactDatafile(callback?: (err: Error | null) => void): void;

  compactDatafileAsync(): Promise<void>;

  setAutocompactionInterval(interval: number): void;

  stopAutocompaction(): void;

  getAllData<T extends Schema>(): Document<T>[];

  ensureIndex(
    options: Nedb.EnsureIndexOptions,
    callback?: (err: Error | null) => void
  ): void;

  ensureIndexAsync(options: Nedb.EnsureIndexOptions): Promise<void>;

  removeIndex(fieldName: string | string[], callback?: (err: Error | null) => void): void;

  removeIndexAsync(fieldName: string | string[]): Promise<void>;

  insert<T extends Schema>(
    newDoc: T,
    callback?: (err: Error | null, document: Document<T>) => void
  ): void;
  insert<T extends Schema>(
    newDocs: T[],
    callback?: (err: Error | null, documents: Document<T>[]) => void
  ): void;

  insertAsync<T extends Schema>(newDoc: T): Promise<Document<T>>;
  insertAsync<T extends Schema>(newDocs: T[]): Promise<Document<T>[]>;

  count(query: any, callback: (err: Error | null, n: number) => void): void;
  count(query: any): Nedb.CursorCount;

  countAsync(query: any): Nedb.Cursor<number>;

  find<T extends Schema>(
    query: any,
    projection: any,
    callback?: (err: Error | null, documents: Document<T>[]) => void
  ): void;
  find<T extends Schema>(
    query: any,
    projection?: any
  ): Nedb.Cursor<T>;
  find<T extends Schema>(
    query: any,
    callback: (err: Error | null, documents: Document<T>[]) => void
  ): void;

  findAsync<T extends Schema>(
    query: any,
    projection?: any
  ): Nedb.Cursor<T[]>;

  findOne<T extends Schema>(
    query: any,
    projection: any,
    callback: (err: Error | null, document: Document<T>) => void
  ): void;
  findOne<T extends Schema>(
    query: any,
    callback: (err: Error | null, document: Document<T>) => void
  ): void;

  findOneAsync<T extends Schema>(
    query: any,
    projection?: any
  ): Nedb.Cursor<T>;

  update<T extends Schema>(
    query: any,
    updateQuery: any,
    options?: Nedb.UpdateOptions,
    callback?: (
      err: Error | null,
      numberOfUpdated: number,
      affectedDocuments: Document<T> | Document<T>[] | null,
      upsert: boolean | null
    ) => void
  ): void;

  updateAsync<T extends Schema>(
    query: any,
    updateQuery: any,
    options?: Nedb.UpdateOptions
  ): Promise<{
    numAffected: number;
    affectedDocuments: Document<T> | Document<T>[] | null;
    upsert: boolean;
  }>;

  remove(
    query: any,
    options: Nedb.RemoveOptions,
    callback?: (err: Error | null, n: number) => void
  ): void;
  remove(query: any, callback?: (err: Error | null, n: number) => void): void;

  removeAsync(query: any, options: Nedb.RemoveOptions): Promise<number>;

  addListener(event: "compaction.done", listener: () => void): this;
  on(event: "compaction.done", listener: () => void): this;
  once(event: "compaction.done", listener: () => void): this;
  prependListener(event: "compaction.done", listener: () => void): this;
  prependOnceListener(event: "compaction.done", listener: () => void): this;
  removeListener(event: "compaction.done", listener: () => void): this;
  off(event: "compaction.done", listener: () => void): this;
  listeners(event: "compaction.done"): Array<() => void>;
  rawListeners(event: "compaction.done"): Array<() => void>;
  listenerCount(type: "compaction.done"): number;
}

declare namespace Nedb {
  interface Cursor<T> extends Promise<T> {
    sort(query: any): Cursor<T>;
    skip(n: number): Cursor<T>;
    limit(n: number): Cursor<T>;
    projection(query: any): Cursor<T>;
    exec(callback: (err: Error | null, documents: Document<T>[]) => void): void;
    execAsync(): Promise<Document<T>>;
  }

  interface CursorCount {
    exec(callback: (err: Error | null, count: number) => void): void;
  }

  interface DataStoreOptions {
    filename?: string;
    timestampData?: boolean;
    inMemoryOnly?: boolean;
    autoload?: boolean;
    onload?(error: Error | null): any;
    beforeDeserialization?(line: string): string;
    afterSerialization?(line: string): string;
    corruptAlertThreshold?: number;
    compareStrings?(a: string, b: string): number;
    modes?: { fileMode: number; dirMode: number };
    testSerializationHooks?: boolean;
  }

  interface UpdateOptions {
    multi?: boolean;
    upsert?: boolean;
    returnUpdatedDocs?: boolean;
  }

  interface RemoveOptions {
    multi?: boolean;
  }

  interface EnsureIndexOptions {
    fieldName: string | string[];
    unique?: boolean;
    sparse?: boolean;
    expireAfterSeconds?: number;
  }

  interface Persistence {
    /** @deprecated */
    compactDatafile(): void;
    /** @deprecated */
    compactDatafileAsync(): Promise<void>;
    /** @deprecated */
    setAutocompactionInterval(interval: number): void;
    /** @deprecated */
    stopAutocompaction(): void;
  }
}
