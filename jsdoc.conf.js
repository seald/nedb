'use strict'

module.exports = {
  plugins: ['plugins/markdown'],
  source: {
    include: ['./lib']
  },
  opts: {
    destination: './docs'
  }
}
