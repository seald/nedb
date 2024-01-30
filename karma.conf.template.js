'use strict'

export default (config) => ({
  // Increase timeout in case connection in CI is slow
  captureTimeout: 120000,
  browserNoActivityTimeout: 300000,
  browserDisconnectTimeout: 300000,
  browserDisconnectTolerance: 3,

  // frameworks to use
  // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
  frameworks: ['mocha', 'chai', 'source-map-support'],

  // list of files / patterns to load in the browser
  files: [
    'node_modules/localforage/dist/localforage.min.js',
    'testutils.min.js',
    'nedb.min.js',
    'test/browser/nedb-browser.spec.js',
    'test/browser/load.spec.js'
  ],

  // test results reporter to use
  // possible values: 'dots', 'progress'
  // available reporters: https://npmjs.org/browse/keyword/karma-reporter
  reporters: ['progress', 'junit'],

  junitReporter: {
    outputDir: 'test-results', // results will be saved as $outputDir/$browserName.xml
    useBrowserName: true // add browser name to report and classes names
  },

  // Continuous Integration mode
  // if true, Karma captures browsers, runs the tests and exits
  singleRun: true,

  // web server port
  port: 9876,

  // enable / disable colors in the output (reporters and logs)
  colors: true,

  // level of logging
  // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
  logLevel: config.LOG_INFO,

  // enable / disable watching file and executing tests whenever any file changes
  autoWatch: false,

  // Concurrency level
  // how many browser should be started simultaneous
  concurrency: 1,

  // base path that will be used to resolve all patterns (eg. files, exclude)
  basePath: '',

  // list of files to exclude
  exclude: []
})
