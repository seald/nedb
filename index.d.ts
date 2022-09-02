// Type definitions for @seald-io/nedb 2.1.0
// Project: https://github.com/seald/nedb forked from https://github.com/louischatriot/nedb
// Definitions by: Timothée Rebours <https://gihub.com/tex0l>
//                 Mehdi Kouhen <https://github.com/arantes555>
//                 Stefan Steinhart <https://github.com/reppners>
//                 Anthony Nichols <https://github.com/anthonynichols>
//                 Alejandro Fernandez Haro <https://github.com/afharo>
// TypeScript Version: 4.4

/// <reference types="node" />

import { EventEmitter } from 'events';

export default Nedb;

declare class Nedb<G = any> extends EventEmitter {
  constructor(pathOrOptions?: string | Nedb.DataStoreOptions);

  persistence: Nedb.Persistence;

  autoloadPromise: Promise<void>|null;

  loadDatabase(callback?: (err: Error | null) => void): void;

  loadDatabaseAsync(): Promise<void>;

  dropDatabase(callback?: (err: Error |null) => void): void;

  dropDatabaseAsync(): Promise<void>;

  compactDatafile(callback?: (err: Error |null) => void): void;

  compactDatafileAsync(): Promise<void>;

  setAutocompactionInterval(interval: number): void;

  stopAutocompaction(): void;

  getAllData<T extends G>(): T[];

  ensureIndex(options: Nedb.EnsureIndexOptions, callback?: (err: Error | null) => void): void;

  ensureIndexAsync(options: Nedb.EnsureIndexOptions): Promise<void>;

  removeIndex(fieldName: string, callback?: (err: Error | null) => void): void;

  removeIndexAsync(fieldName: string): Promise<void>;

  insert<T extends G>(newDoc: T, callback?: (err: Error | null, document: T) => void): void;
  insert<T extends G>(newDocs: T[], callback?: (err: Error | null, documents: T[]) => void): void;

  insertAsync<T extends G>(newDoc: T): Promise<T>;
  insertAsync<T extends G>(newDocs: T[]): Promise<T[]>;

  count(query: any, callback: (err: Error | null, n: number) => void): void;
  count(query: any): Nedb.CursorCount;

  countAsync(query: any): Nedb.Cursor<number>;

  find<T extends G>(query: any, projection: any, callback?: (err: Error | null, documents: T[]) => void): void;
  find<T extends G>(query: any, projection?: any): Nedb.Cursor<T>;
  find<T extends G>(query: any, callback: (err: Error | null, documents: T[]) => void): void;

  findAsync<T extends G>(query: any, projection?: any): Nedb.Cursor<T[]>;

  findOne<T extends G>(query: any, projection: any, callback: (err: Error | null, document: T) => void): void;
  findOne<T extends G>(query: any, callback: (err: Error | null, document: T) => void): void;

  findOneAsync<T extends G>(query: any, projection?: any): Nedb.Cursor<T>;

  update<T extends G>(query: any, updateQuery: any, options?: Nedb.UpdateOptions, callback?: (err: Error | null, numberOfUpdated: number, affectedDocuments: T | T[] | null, upsert: boolean | null) => void): void;

  updateAsync<T extends G>(query: any, updateQuery: any, options?: Nedb.UpdateOptions): Promise<{numAffected: number, affectedDocuments: T|T[]|null, upsert: boolean}>;

  remove(query: any, options: Nedb.RemoveOptions, callback?: (err: Error | null, n: number) => void): void;
  remove(query: any, callback?: (err: Error | null, n: number) => void): void;

  removeAsync(query: any, options: Nedb.RemoveOptions): Promise<number>;

  addListener(event: 'compaction.done', listener: () => void): this;
  on(event: 'compaction.done', listener: () => void): this;
  once(event: 'compaction.done', listener: () => void): this;
  prependListener(event: 'compaction.done', listener: () => void): this;
  prependOnceListener(event: 'compaction.done', listener: () => void): this;
  removeListener(event: 'compaction.done', listener: () => void): this;
  off(event: 'compaction.done', listener: () => void): this;
  listeners(event: 'compaction.done'): Array<() => void>;
  rawListeners(event: 'compaction.done'): Array<() => void>;
  listenerCount(type: 'compaction.done'): number;
}

declare namespace Nedb {
  interface Cursor<T> extends Promise<T> {
    sort(query: any): Cursor<T>;
    skip(n: number): Cursor<T>;
    limit(n: number): Cursor<T>;
    projection(query: any): Cursor<T>;
    exec(callback: (err: Error | null, documents: T[]) => void): void;
    execAsync(): Promise<T>;
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
    modes?: {fileMode: number, dirMode: number};
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
    fieldName: string;
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
