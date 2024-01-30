'use strict'

import template from './karma.conf.template.js'

export default function (config) {
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
