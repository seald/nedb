/* eslint-env mocha */
// Copyright (C) 2013-2015 John Hewson
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

import chai from "chai";
import fs from "fs";
import path from "path";
import byline from "../src/byline";

const { assert } = chai;

const regEx = /\r\n|[\n\v\f\r\x85\u2028\u2029]/g;
const localPath = (file) => path.join(__dirname, "byline", file);

describe("byline", function () {
  it("should pipe a small file", function (done) {
    const input = fs.createReadStream(localPath("empty.txt"));
    const lineStream = byline(input); // convinience API
    const output = fs.createWriteStream(localPath("test.txt"));
    lineStream.pipe(output);
    output.on("close", function () {
      const out = fs.readFileSync(localPath("test.txt"), "utf8");
      const in_ = fs
        .readFileSync(localPath("empty.txt"), "utf8")
        .replace(/\r?\n/g, "");
      assert.equal(in_, out);
      fs.unlinkSync(localPath("test.txt"));
      done();
    });
  });

  it("should work with streams2 API", function (done) {
    let stream = fs.createReadStream(localPath("empty.txt"));
    stream = byline(stream);

    stream.on("readable", function () {
      while (stream.read() !== null) {
        // eslint-ignore-line no-empty
      }
    });

    stream.on("end", function () {
      done();
    });
  });

  it("should ignore empty lines by default", function (done) {
    const input = fs.createReadStream(localPath("empty.txt"));
    const lineStream = byline(input);
    lineStream.setEncoding("utf8");

    const lines1 = [];
    lineStream.on("data", function (line) {
      lines1.push(line);
    });

    lineStream.on("end", function () {
      let lines2 = fs.readFileSync(localPath("empty.txt"), "utf8").split(regEx);
      lines2 = lines2.filter(function (line) {
        return line.length > 0;
      });
      assert.deepEqual(lines2, lines1);
      done();
    });
  });

  it("should keep empty lines when keepEmptyLines is true", function (done) {
    const input = fs.createReadStream(localPath("empty.txt"));
    const lineStream = byline(input, { keepEmptyLines: true });
    lineStream.setEncoding("utf8");

    const lines = [];
    lineStream.on("data", function (line) {
      lines.push(line);
    });

    lineStream.on("end", function () {
      assert.deepEqual(["", "", "", "", "", "Line 6"], lines);
      done();
    });
  });

  it("should not split a CRLF which spans two chunks", function (done) {
    const input = fs.createReadStream(localPath("CRLF.txt"));
    const lineStream = byline(input, { keepEmptyLines: true });
    lineStream.setEncoding("utf8");

    const lines = [];
    lineStream.on("data", function (line) {
      lines.push(line);
    });

    lineStream.on("end", function () {
      assert.equal(2, lines.length);
      done();
    });
  });

  it("should read a large file", function (done) {
    readFile(localPath("rfc.txt"), done);
  });

  it("should read a huge file", function (done) {
    // Readable highWaterMark is 16384, so we test a file with more lines than this
    readFile(localPath("rfc_huge.txt"), done);
  });

  function readFile(filename, done) {
    const input = fs.createReadStream(filename);
    const lineStream = byline(input);
    lineStream.setEncoding("utf8");

    let lines2 = fs.readFileSync(filename, "utf8").split(regEx);
    lines2 = lines2.filter(function (line) {
      return line.length > 0;
    });

    const lines1 = [];
    let i = 0;
    lineStream.on("data", function (line) {
      lines1.push(line);
      if (line !== lines2[i]) {
        console.log("EXPECTED:", lines2[i]);
        console.log("     GOT:", line);
        assert.fail(null, null, "difference at line " + (i + 1));
      }
      i++;
    });

    lineStream.on("end", function () {
      assert.equal(lines2.length, lines1.length);
      assert.deepEqual(lines2, lines1);
      done();
    });
  }

  it("should handle encodings like fs", function (done) {
    areStreamsEqualTypes(undefined, function () {
      areStreamsEqualTypes({ encoding: "utf8" }, function () {
        done();
      });
    });
  });

  it("should pause() and resume() with a huge file", function (done) {
    const input = fs.createReadStream(localPath("rfc_huge.txt"));
    const lineStream = byline(input);
    lineStream.setEncoding("utf8");

    let lines2 = fs
      .readFileSync(localPath("rfc_huge.txt"), "utf8")
      .split(regEx);
    lines2 = lines2.filter(function (line) {
      return line.length > 0;
    });

    const lines1 = [];
    let i = 0;
    lineStream.on("data", function (line) {
      lines1.push(line);
      if (line !== lines2[i]) {
        console.log("EXPECTED:", lines2[i]);
        console.log("     GOT:", line);
        assert.fail(null, null, "difference at line " + (i + 1));
      }
      i++;

      // pause/resume
      lineStream.pause();
      setImmediate(function () {
        lineStream.resume();
      });
    });

    lineStream.on("end", function () {
      assert.equal(lines2.length, lines1.length);
      assert.deepEqual(lines2, lines1);
      done();
    });
  });

  function areStreamsEqualTypes(options, callback) {
    const fsStream = fs.createReadStream(localPath("empty.txt"), options);
    const lineStream = byline(
      fs.createReadStream(localPath("empty.txt"), options)
    );
    fsStream.on("data", function (data1) {
      lineStream.on("data", function (data2) {
        assert.equal(Buffer.isBuffer(data1), Buffer.isBuffer(data2));
      });
      lineStream.on("end", function () {
        callback();
      });
    });
  }
});
