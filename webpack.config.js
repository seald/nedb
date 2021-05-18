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
        util: require.resolve('util/'),
        events: require.resolve('events/'),
        crypto: false
      }
    },
    plugins: [
      new webpack.NormalModuleReplacementPlugin(new RegExp(path.resolve(__dirname, 'lib/storage.js')), path.resolve(__dirname, 'browser-version/lib/storage.js')),
      new webpack.NormalModuleReplacementPlugin(new RegExp(path.resolve(__dirname, 'lib/customUtils.js')), path.resolve(__dirname, 'browser-version/lib/customUtils.js')),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
        setImmediate: ['timers-browserify', 'setImmediate'],
        clearImmediate: ['timers-browserify', 'clearImmediate']
      })
    ],
    entry: {
      Nedb: path.join(__dirname, 'lib', 'datastore.js')
    },
    output: {
      path: path.join(__dirname, 'browser-version/out'),
      filename: minimize ? 'nedb.min.js' : 'nedb.js',
      libraryTarget: 'window',
      library: '[name]'
    }
  }
}
