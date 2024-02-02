const browserResolve = require('browser-resolve')

module.exports = (id, opts) => browserResolve.sync(id, { ...opts, browser: 'react-native' })
