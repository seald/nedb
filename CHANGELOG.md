# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2022-09-02
### Added
- Added a `testSerializationHooks` option which defaults to `true`. Setting to `false` allows to skip the test of the hooks, which may be slow.

## [3.0.0] - 2022-03-16
### Added
- Added a `Promise`-based interface.
- The JSDoc is now much more exhaustive.
- An auto-generated JSDoc file is generated: [API.md](./API.md).
- Added `Datastore#dropDatabaseAsync` and its callback equivalent.
- The Error given when the `Datastore#corruptAlertThreshold` is reached now has three properties: `dataLength` which is the amount of lines in the database file (excluding empty lines), `corruptItems` which is the amount of corrupted lines, `corruptionRate` which the rate of corruption between 0 and 1.
- Added a `modes: { fileMode, dirMode }` option to the Datastore which allows to set the file and / or directory modes, by default, it uses `0o644` for files and `0o755` for directories, which may be breaking.

### Changed
- The `corruptionAlertThreshold` now doesn't take into account empty lines, and the error message is slightly changed.
- The `Datastore#update`'s callback has its signature slightly changed. The
`upsert` flag is always defined either at `true` or `false` but not `null` nor
`undefined`, and `affectedDocuments` is `null` when none is given rather than
`undefined` (except when there is an error of course).
- In order to expose a `Promise`-based interface and to remove `async` from the dependencies, many internals have been either rewritten or removed:
  - Datastore:
    - `Datastore#getCandidates` replaced with `Datastore#_getCandidatesAsync`;
    - `Datastore#resetIndexes` replaced with `Datastore#_resetIndexes`;
    - `Datastore#addToIndexes` replaced with `Datastore#_addToIndexes`;
    - `Datastore#removeFromIndexes` replaced with `Datastore#_removeFromIndexes`;
    - `Datastore#updateIndexes` replaced with `Datastore#_updateIndexes`;
    - `Datastore#_insert` replaced with `Datastore#_insertAsync`;
    - `Datastore#_update` replaced with `Datastore#_updateAsync`;
    - `Datastore#_remove` replaced with `Datastore#_removeAsync`;
  - Persistence:
    - `Persistence#loadDatabase` replaced with `Persistence#loadDatabaseAsync`;
    - `Persistence#persistCachedDatabase` replaced with `Persistence#persistCachedDatabaseAsync`;
    - `Persistence#persistNewState` replaced with `Persistence#persistNewStateAsync`;
    - `Persistence#treatRawStream` replaced with `Persistence#treatRawStreamAsync`;
    - `Persistence.ensureDirectoryExists` replaced with `Persistence#ensureDirectoryExistsAsync`;
  - Cursor:
    - `Cursor#_exec` replaced with `Cursor#_execAsync`;
    - `Cursor#project` replaced with `Cursor#_project`;
    - `Cursor#execFn` has been renamed to `Cursor#mapFn` and no longer supports a callback in its signature, it must be a synchronous function.
  - Executor: it has been rewritten entirely without the `async`library.
    - `Executor#buffer` & `Executor#queue` do not have the same signatures as before;
    - `Executor#push` replaced with `Executor#pushAsync` which is substantially different;
  - Storage modules : callback-based functions have been replaced with promise-based functions.
  - Model module: it has been slightly re-written for clarity, but no changes in its interface were made.
- Typings were updated accordingly.

## Deprecated
- Using a `string` in the constructor of NeDB is now deprecated.
- Using `Datastore#persistence#compactDatafile` is now deprecated, please use `Datastore#compactDatafile` instead.
- Using `Datastore#persistence#setAutocompactionInterval` is now deprecated, please use `Datastore#setAutocompactionInterval` instead.
- Using `Datastore#persistence#stopAutocompaction` is now deprecated, please use `Datastore#stopAutocompaction` instead.

## Removed
- The option for passing `options.nodeWebkitAppName` to the Datastore and the Persistence constructors has been removed, subsequently, the static method `Persistence.getNWAppFilename` has been removed as well;
- Compatibility with node < 10.1.0 (we use `fs.promises`).

## Fixed 
- \[cherry picked from 2.2.2\] [#21](https://github.com/seald/nedb/issues/21) Typings for loadDatabase now support a callback.

## [2.2.2] - 2022-03-10
### Fixed
- [#21](https://github.com/seald/nedb/issues/21) Typings for loadDatabase now support a callback.

## [2.2.1] - 2022-01-18
### Changed
- [#20](https://github.com/seald/nedb/pull/20) storage.js: check fsync capability from return code rather than using process.platform heuristics (Thanks [@bitmeal](https://github.com/bitmeal)).

## [2.2.0] - 2021-10-29
### Added
- Include a `"react-native"` version (heavily inspired from [react-native-local-mongdb](https://github.com/antoniopresto/react-native-local-mongodb)).
### Changed
- The browser version uses `browser-version/lib/storage.browser.js` instead of `browser-version/lib/storage.js` in the `"browser"` field of the package.json.

## [2.1.0] - 2021-10-21
Thanks to [@eliot-akira](https://github.com/eliot-akira) for the amazing work on file streaming.
### Changed
- [implement file streaming of the database](https://github.com/seald/nedb/pull/5) like [a PR on the original repo](https://github.com/louischatriot/nedb/pull/463) did;
- internalize [`byline`](https://github.com/jahewson/node-byline) package because it is unmaintained.
- TypeScript typings inside the package.

## [2.0.4] - 2021-07-12
### Fixed
- switch back to an AVLTree instead of a BinarySearchTree like the original nedb to fix [#1](https://github.com/seald/nedb/issues/1).
- updated vulnerable dev dependency `ws`

## [2.0.3] - 2021-06-07
### Fixed
- no longer use `util` module for type verification as it is needed in the
  browser, which would need a polyfill.
  
## [2.0.2] - 2021-05-26
### Fixed
- the `browser` field of the `package.json` no longer points to the bundled
  minified version for the browser, but switches the `storage.js` and
  `customUtils.js` to their browser version, just like the original repository
  used to do.

## [2.0.1] - 2021-05-19

### Changed

- bump `@seald-io/binary-search-tree` to 1.0.2, which does not depend
  on `underscore`;
- replace use of `underscore` by pure JS.

## [2.0.0] - 2021-05-18

This version should be a drop-in replacement for `nedb@1.8.0` provided you use
modern browsers / versions of Node.js since ES6 features are now used (such
as `class` and `const` / `let`).

### Changed

- Update `homepage` & `repository` fields in the `package.json`
- New maintainer [seald](https://github.com/seald/) and new package
  name [@seald-io/nedb](https://www.npmjs.com/package/@seald-io/nedb);
- Added `lockfileVersion: 2` `package-lock.json`;
- Modernized some of the code with ES6 features (`class`, `const` & `let`);
- Uses [`standard`](https://standardjs.com/) to lint the code (which removes all
  unnecessary semicolons);
- Updated dependencies, except `async` which stays at `0.2.10` for the moment;
- Stop including the browser version in the repository, and properly build it
  with `webpack`;
- Uses `karma` to run the browser tests, and use npm to fetch versioned
  dependencies rather than having hardcoded copies of the dependencies in the
  repository;
- Internalized `exec-time` dependency for the benchmarks, because it was
  unmaintained;
- Uses `@seald-io/binary-search-tree` rather than
  unmaintained `binary-search-tree`;

### Removed

- Compatibility with old browsers and old version of Node.js that don't support
  ES6 features.
- From now on, this package won't be published with `bower` as it became
  essentially useless.
- Entries in the `browser` field of package.json don't include individual files,
  only the bundled minified version, those files are still published with the
  package.

### Security

- This version no longer
  uses [a vulnerable version of `underscore`](https://github.com/advisories/GHSA-cf4h-3jhx-xvhq)
  .

## [1.8.0] - 2016-02-15

See [original repo](https://github.com/louischatriot/nedb)
