# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2021-10-29
### Added
- Include a `"react-native"` version (heavily inspired from [react-native-local-mongdb](https://github.com/antoniopresto/react-native-local-mongodb)).

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
