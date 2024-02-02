'use strict'

import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import webpack from 'webpack'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default (env, argv) => {
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
      path: join(__dirname, 'dist'),
      filename: pathData => `${pathData.chunk.name.toLowerCase()}${minimize ? '.min' : ''}.js`,
      libraryTarget: 'window',
      library: '[name]'
    }
  }

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
      output: {
        ...baseConfig.output,
        libraryExport: 'default'
      },
      name: 'Nedb',
      resolve: {
        aliasFields: ['browser'], // to use files referenced in the package.json
      },
      entry: {
        Nedb: join(__dirname, 'src', 'datastore.js')
      }
    },
    {
      ...baseConfig,
      name: 'testUtils',
      plugins: polyfillPlugins,
      resolve: {
        fallback: {
          fs: false,
          path: import.meta.resolve('path-browserify'),
          util: import.meta.resolve('util/'),
          crypto: false
        }
      },
      entry: {
        testUtils: join(__dirname, 'test', 'utils.test.js')
      }
    }
  ]
}
