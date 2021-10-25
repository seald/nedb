'use strict'

const path = require('path')
const webpack = require('webpack')

module.exports = (env, argv) => {
  const minimize = argv.optimizationMinimize || false
  return {
    mode: 'production',
    cache: false,
    watch: false,
    target: 'web',
    node: {
      global: true
    },
    optimization: {
      minimize: minimize
    },
    resolve: {
      fallback: {
        fs: false,
        path: require.resolve('path-browserify'),
        events: require.resolve('events/'),
        crypto: false
      }
    },
    plugins: [
      new webpack.NormalModuleReplacementPlugin(new RegExp(path.resolve(__dirname, 'lib/storage.js')), path.resolve(__dirname, 'browser-version/lib/storage.browser.js')),
      new webpack.NormalModuleReplacementPlugin(new RegExp(path.resolve(__dirname, 'lib/customUtils.js')), path.resolve(__dirname, 'browser-version/lib/customUtils.js')),
      new webpack.NormalModuleReplacementPlugin(/byline/, path.resolve(__dirname, 'browser-version/lib/byline.js')),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
        setImmediate: ['timers-browserify', 'setImmediate'],
        clearImmediate: ['timers-browserify', 'clearImmediate'],
        util: 'util'
      })
    ],
    entry: {
      Nedb: path.join(__dirname, 'lib', 'datastore.js'),
      testUtils: path.join(__dirname, 'test', 'utils.test.js')
    },
    output: {
      path: path.join(__dirname, 'browser-version/out'),
      filename: `[name]${minimize ? '.min' : ''}.js`,
      libraryTarget: 'window',
      library: '[name]'
    }
  }
}
