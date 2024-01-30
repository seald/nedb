import browserResolve from 'browser-resolve'

export default (id, opts) => browserResolve.sync(id, { ...opts, browser: 'react-native' })
