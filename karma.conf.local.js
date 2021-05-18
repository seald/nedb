'use strict'
/* eslint-disable @typescript-eslint/no-var-requires */

const template = require('./karma.conf.template.js')

module.exports = function (config) {
  const localBrowser = {
    ChromeHeadlessNoSandbox: {
      base: 'ChromeHeadless',
      flags: ['--no-sandbox']
    }
  }

  config.set(Object.assign({}, template(config), {
    customLaunchers: localBrowser,
    browsers: ['ChromeHeadlessNoSandbox']
    // browsers: ['FirefoxHeadless'],
    // browsers: ['Safari'],
    // browsers: ['ChromeHeadlessNoSandbox', 'FirefoxHeadless', 'Safari'],

    // concurrency: 3
  }))
}
