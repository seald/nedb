// Forked from https://github.com/jahewson/node-byline

// Copyright (C) 2011-2015 John Hewson
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
/**
 * @module byline
 * @private
 */
const stream = require('stream')
const timers = require('timers')
const { Buffer } = require('buffer')

const createLineStream = (readStream, options) => {
  if (!readStream) throw new Error('expected readStream')
  if (!readStream.readable) throw new Error('readStream must be readable')
  const ls = new LineStream(options)
  readStream.pipe(ls)
  return ls
}

/**
 * Fork from {@link https://github.com/jahewson/node-byline}.
 * @see https://github.com/jahewson/node-byline
 * @alias module:byline.LineStream
 * @private
 */
class LineStream extends stream.Transform {
  constructor (options) {
    super(options)
    options = options || {}

    // use objectMode to stop the output from being buffered
    // which re-concatanates the lines, just without newlines.
    this._readableState.objectMode = true
    this._lineBuffer = []
    this._keepEmptyLines = options.keepEmptyLines || false
    this._lastChunkEndedWithCR = false

    // take the source's encoding if we don't have one
    this.once('pipe', src => {
      if (!this.encoding && src instanceof stream.Readable) this.encoding = src._readableState.encoding // but we can't do this for old-style streams
    })
  }

  _transform (chunk, encoding, done) {
    // decode binary chunks as UTF-8
    encoding = encoding || 'utf8'

    if (Buffer.isBuffer(chunk)) {
      if (encoding === 'buffer') {
        chunk = chunk.toString() // utf8
        encoding = 'utf8'
      } else chunk = chunk.toString(encoding)
    }
    this._chunkEncoding = encoding

    // see: http://www.unicode.org/reports/tr18/#Line_Boundaries
    const lines = chunk.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/g)

    // don't split CRLF which spans chunks
    if (this._lastChunkEndedWithCR && chunk[0] === '\n') lines.shift()

    if (this._lineBuffer.length > 0) {
      this._lineBuffer[this._lineBuffer.length - 1] += lines[0]
      lines.shift()
    }

    this._lastChunkEndedWithCR = chunk[chunk.length - 1] === '\r'
    this._lineBuffer = this._lineBuffer.concat(lines)
    this._pushBuffer(encoding, 1, done)
  }

  _pushBuffer (encoding, keep, done) {
    // always buffer the last (possibly partial) line
    while (this._lineBuffer.length > keep) {
      const line = this._lineBuffer.shift()
      // skip empty lines
      if (this._keepEmptyLines || line.length > 0) {
        if (!this.push(this._reencode(line, encoding))) {
          // when the high-water mark is reached, defer pushes until the next tick
          timers.setImmediate(() => { this._pushBuffer(encoding, keep, done) })
          return
        }
      }
    }
    done()
  }

  _flush (done) {
    this._pushBuffer(this._chunkEncoding, 0, done)
  }

  // see Readable::push
  _reencode (line, chunkEncoding) {
    if (this.encoding && this.encoding !== chunkEncoding) return Buffer.from(line, chunkEncoding).toString(this.encoding)
    else if (this.encoding) return line // this should be the most common case, i.e. we're using an encoded source stream
    else return Buffer.from(line, chunkEncoding)
  }
}

module.exports = createLineStream
