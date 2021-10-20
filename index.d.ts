// Type definitions for @seald-io/nedb 2.1.0
// Project: https://github.com/seald/nedb forked from https://github.com/louischatriot/nedb
// Definitions by: Mehdi Kouhen <https://github.com/arantes555>
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

  loadDatabase(): void;

  getAllData<T extends G>(): T[];

  resetIndexes(newData?: any): void;

  ensureIndex(options: Nedb.EnsureIndexOptions, callback?: (err: Error | null) => void): void;

  removeIndex(fieldName: string, callback?: (err: Error | null) => void): void;

  addToIndexes<T extends G>(doc: T | T[]): void;

  removeFromIndexes<T extends G>(doc: T | T[]): void;

  updateIndexes<T extends G>(oldDoc: T, newDoc: T): void;
  updateIndexes<T extends G>(updates: Array<{ oldDoc: T; newDoc: T }>): void;

  getCandidates<T extends G>(query: any, dontExpireStaleDocs: boolean, callback?: (err: Error | null, candidates: T[]) => void): void;

  insert<T extends G>(newDoc: T, callback?: (err: Error | null, document: T) => void): void;
  insert<T extends G>(newDocs: T[], callback?: (err: Error | null, documents: T[]) => void): void;

  count(query: any, callback: (err: Error | null, n: number) => void): void;
  count(query: any): Nedb.CursorCount;

  find<T extends G>(query: any, projection: any, callback?: (err: Error | null, documents: T[]) => void): void;
  find<T extends G>(query: any, projection?: any): Nedb.Cursor<T>;
  find<T extends G>(query: any, callback: (err: Error | null, documents: T[]) => void): void;

  findOne<T extends G>(query: any, projection: any, callback: (err: Error | null, document: T) => void): void;
  findOne<T extends G>(query: any, callback: (err: Error | null, document: T) => void): void;

  update<T extends G>(query: any, updateQuery: any, options?: Nedb.UpdateOptions, callback?: (err: Error | null, numberOfUpdated: number, affectedDocuments: T | T[] | null, upsert: boolean | null) => void): void;

  remove(query: any, options: Nedb.RemoveOptions, callback?: (err: Error | null, n: number) => void): void;
  remove(query: any, callback?: (err: Error | null, n: number) => void): void;

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
  interface Cursor<T> {
    sort(query: any): Cursor<T>;
    skip(n: number): Cursor<T>;
    limit(n: number): Cursor<T>;
    projection(query: any): Cursor<T>;
    exec(callback: (err: Error | null, documents: T[]) => void): void;
  }

  interface CursorCount {
    exec(callback: (err: Error | null, count: number) => void): void;
  }

  interface DataStoreOptions {
    filename?: string;
    timestampData?: boolean;
    inMemoryOnly?: boolean;
    nodeWebkitAppName?: string;
    autoload?: boolean;
    onload?(error: Error | null): any;
    beforeDeserialization?(line: string): string;
    afterSerialization?(line: string): string;
    corruptAlertThreshold?: number;
    compareStrings?(a: string, b: string): number;
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
    compactDatafile(): void;
    setAutocompactionInterval(interval: number): void;
    stopAutocompaction(): void;
  }
}
