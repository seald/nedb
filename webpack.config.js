'use strict'

const path = require('path')
const webpack = require('webpack')

module.exports = (env, argv) => {
  const minimize = argv.env.minimize || false

  const baseConfig = {
    mode: 'production',
    cache: false,
    watch: false,
    target: 'web',
    optimization: {
      minimize
    },
    output: {
      path: path.join(__dirname, 'browser-version/out'),
      filename: pathData => `${pathData.chunk.name.toLowerCase()}${minimize ? '.min' : ''}.js`,
      libraryTarget: 'window',
      library: '[name]'
    }
  }

  const pluginsNedb = [
    new webpack.NormalModuleReplacementPlugin(new RegExp(path.resolve(__dirname, 'lib/storage.js')), path.resolve(__dirname, 'browser-version/lib/storage.browser.js')),
    new webpack.NormalModuleReplacementPlugin(new RegExp(path.resolve(__dirname, 'lib/customUtils.js')), path.resolve(__dirname, 'browser-version/lib/customUtils.js')),
    new webpack.NormalModuleReplacementPlugin(/byline/, path.resolve(__dirname, 'browser-version/lib/byline.js'))
  ]

  const polyfillPlugins = [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
      setImmediate: ['timers-browserify', 'setImmediate'],
      clearImmediate: ['timers-browserify', 'clearImmediate']
    })
  ]

  return [
    {
      ...baseConfig,
      name: 'Nedb',
      plugins: pluginsNedb,
      entry: {
        Nedb: path.join(__dirname, 'lib', 'datastore.js')
      }
    },
    {
      ...baseConfig,
      name: 'testUtils',
      plugins: polyfillPlugins,
      resolve: {
        fallback: {
          fs: false,
          path: require.resolve('path-browserify'),
          util: require.resolve('util/'),
          crypto: false
        }
      },
      entry: {
        testUtils: path.join(__dirname, 'test', 'utils.test.js')
      }
    }
  ]
}
