<a name="module_storage"></a>

## storage
<p>Way data is stored for this database.
This version is the Node.js/Node Webkit version.
It's essentially fs, mkdirp and crash safe write and read functions.</p>

**See**

- module:storageBrowser
- module:storageReactNative


* [storage](#module_storage)
    * _static_
        * [.exists(file, cb)](#module_storage.exists)
        * [.existsAsync(file)](#module_storage.existsAsync) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.rename(oldPath, newPath, c)](#module_storage.rename) ⇒ <code>void</code>
        * [.renameAsync(oldPath, newPath)](#module_storage.renameAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.writeFile(path, data, options, callback)](#module_storage.writeFile)
        * [.writeFileAsync(path, data, [options])](#module_storage.writeFileAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.writeFileStream(path, [options])](#module_storage.writeFileStream) ⇒ <code>fs.WriteStream</code>
        * [.unlink(path, callback)](#module_storage.unlink)
        * [.unlinkAsync(path)](#module_storage.unlinkAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.appendFile(path, data, options, callback)](#module_storage.appendFile)
        * [.appendFileAsync(path, data, [options])](#module_storage.appendFileAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.readFile(path, options, callback)](#module_storage.readFile)
        * [.readFileAsync(path, [options])](#module_storage.readFileAsync) ⇒ <code>Promise.&lt;Buffer&gt;</code>
        * [.readFileStream(path, [options])](#module_storage.readFileStream) ⇒ <code>fs.ReadStream</code>
        * [.mkdir(path, options, callback)](#module_storage.mkdir)
        * [.mkdirAsync(path, options)](#module_storage.mkdirAsync) ⇒ <code>Promise.&lt;(void\|string)&gt;</code>
        * [.ensureFileDoesntExistAsync(file)](#module_storage.ensureFileDoesntExistAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.ensureFileDoesntExist(file, callback)](#module_storage.ensureFileDoesntExist)
        * [.flushToStorage(options, callback)](#module_storage.flushToStorage)
        * [.flushToStorageAsync(options)](#module_storage.flushToStorageAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.writeFileLines(filename, lines, [callback])](#module_storage.writeFileLines)
        * [.writeFileLinesAsync(filename, lines)](#module_storage.writeFileLinesAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.crashSafeWriteFileLines(filename, lines, [callback])](#module_storage.crashSafeWriteFileLines)
        * [.crashSafeWriteFileLinesAsync(filename, lines)](#module_storage.crashSafeWriteFileLinesAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.ensureDatafileIntegrity(filename, callback)](#module_storage.ensureDatafileIntegrity)
        * [.ensureDatafileIntegrityAsync(filename)](#module_storage.ensureDatafileIntegrityAsync) ⇒ <code>Promise.&lt;void&gt;</code>
    * _inner_
        * [~existsCallback](#module_storage..existsCallback) : <code>function</code>

<a name="module_storage.exists"></a>

### storage.exists(file, cb)
<p>Callback returns true if file exists.</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- file <code>string</code>
- cb [<code>existsCallback</code>](#module_storage..existsCallback)

<a name="module_storage.existsAsync"></a>

### storage.existsAsync(file) ⇒ <code>Promise.&lt;boolean&gt;</code>
<p>Async version of [exists](#module_storage.exists).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.exists  
**Params**

- file <code>string</code>

<a name="module_storage.rename"></a>

### storage.rename(oldPath, newPath, c) ⇒ <code>void</code>
<p>Node.js' [fs.rename](https://nodejs.org/api/fs.html#fsrenameoldpath-newpath-callback).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- oldPath <code>string</code>
- newPath <code>string</code>
- c [<code>NoParamCallback</code>](#NoParamCallback)

<a name="module_storage.renameAsync"></a>

### storage.renameAsync(oldPath, newPath) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [rename](#module_storage.rename).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.rename  
**Params**

- oldPath <code>string</code>
- newPath <code>string</code>

<a name="module_storage.writeFile"></a>

### storage.writeFile(path, data, options, callback)
<p>Node.js' [fs.writeFile](https://nodejs.org/api/fs.html#fswritefilefile-data-options-callback).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- path <code>string</code>
- data <code>string</code>
- options <code>object</code>
- callback <code>function</code>

<a name="module_storage.writeFileAsync"></a>

### storage.writeFileAsync(path, data, [options]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [writeFile](#module_storage.writeFile).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.writeFile  
**Params**

- path <code>string</code>
- data <code>string</code>
- [options] <code>object</code>

<a name="module_storage.writeFileStream"></a>

### storage.writeFileStream(path, [options]) ⇒ <code>fs.WriteStream</code>
<p>Node.js' [fs.createWriteStream](https://nodejs.org/api/fs.html#fscreatewritestreampath-options).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- path <code>string</code>
- [options] <code>Object</code>

<a name="module_storage.unlink"></a>

### storage.unlink(path, callback)
<p>Node.js' [fs.unlink](https://nodejs.org/api/fs.html#fsunlinkpath-callback).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- path <code>string</code>
- callback <code>function</code>

<a name="module_storage.unlinkAsync"></a>

### storage.unlinkAsync(path) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [unlink](#module_storage.unlink).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.unlink  
**Params**

- path <code>string</code>

<a name="module_storage.appendFile"></a>

### storage.appendFile(path, data, options, callback)
<p>Node.js' [fs.appendFile](https://nodejs.org/api/fs.html#fsappendfilepath-data-options-callback).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- path <code>string</code>
- data <code>string</code>
- options <code>object</code>
- callback <code>function</code>

<a name="module_storage.appendFileAsync"></a>

### storage.appendFileAsync(path, data, [options]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [appendFile](#module_storage.appendFile).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.appendFile  
**Params**

- path <code>string</code>
- data <code>string</code>
- [options] <code>object</code>

<a name="module_storage.readFile"></a>

### storage.readFile(path, options, callback)
<p>Node.js' [fs.readFile](https://nodejs.org/api/fs.html#fsreadfilepath-options-callback)</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- path <code>string</code>
- options <code>object</code>
- callback <code>function</code>

<a name="module_storage.readFileAsync"></a>

### storage.readFileAsync(path, [options]) ⇒ <code>Promise.&lt;Buffer&gt;</code>
<p>Async version of [readFile](#module_storage.readFile).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.readFile  
**Params**

- path <code>string</code>
- [options] <code>object</code>

<a name="module_storage.readFileStream"></a>

### storage.readFileStream(path, [options]) ⇒ <code>fs.ReadStream</code>
<p>Node.js' [fs.createReadStream](https://nodejs.org/api/fs.html#fscreatereadstreampath-options).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- path <code>string</code>
- [options] <code>Object</code>

<a name="module_storage.mkdir"></a>

### storage.mkdir(path, options, callback)
<p>Node.js' [fs.mkdir](https://nodejs.org/api/fs.html#fsmkdirpath-options-callback).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- path <code>string</code>
- options <code>object</code>
- callback <code>function</code>

<a name="module_storage.mkdirAsync"></a>

### storage.mkdirAsync(path, options) ⇒ <code>Promise.&lt;(void\|string)&gt;</code>
<p>Async version of [mkdir](#module_storage.mkdir).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.mkdir  
**Params**

- path <code>string</code>
- options <code>object</code>

<a name="module_storage.ensureFileDoesntExistAsync"></a>

### storage.ensureFileDoesntExistAsync(file) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [ensureFileDoesntExist](#module_storage.ensureFileDoesntExist)</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.ensureFileDoesntExist  
**Params**

- file <code>string</code>

<a name="module_storage.ensureFileDoesntExist"></a>

### storage.ensureFileDoesntExist(file, callback)
<p>Removes file if it exists.</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- file <code>string</code>
- callback [<code>NoParamCallback</code>](#NoParamCallback)

<a name="module_storage.flushToStorage"></a>

### storage.flushToStorage(options, callback)
<p>Flush data in OS buffer to storage if corresponding option is set.</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- options <code>object</code> | <code>string</code> - <p>If options is a string, it is assumed that the flush of the file (not dir) called options was requested</p>
    - [.filename] <code>string</code>
    - [.isDir] <code>boolean</code> <code> = false</code> - <p>Optional, defaults to false</p>
- callback [<code>NoParamCallback</code>](#NoParamCallback)

<a name="module_storage.flushToStorageAsync"></a>

### storage.flushToStorageAsync(options) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [flushToStorage](#module_storage.flushToStorage).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.flushToStorage  
**Params**

- options <code>object</code> | <code>string</code>
    - [.filename] <code>string</code>
    - [.isDir] <code>boolean</code> <code> = false</code>

<a name="module_storage.writeFileLines"></a>

### storage.writeFileLines(filename, lines, [callback])
<p>Fully write or rewrite the datafile.</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- filename <code>string</code>
- lines <code>Array.&lt;string&gt;</code>
- [callback] [<code>NoParamCallback</code>](#NoParamCallback) <code> = () &#x3D;&gt; {}</code>

<a name="module_storage.writeFileLinesAsync"></a>

### storage.writeFileLinesAsync(filename, lines) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [writeFileLines](#module_storage.writeFileLines).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.writeFileLines  
**Params**

- filename <code>string</code>
- lines <code>Array.&lt;string&gt;</code>

<a name="module_storage.crashSafeWriteFileLines"></a>

### storage.crashSafeWriteFileLines(filename, lines, [callback])
<p>Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- filename <code>string</code>
- lines <code>Array.&lt;string&gt;</code>
- [callback] [<code>NoParamCallback</code>](#NoParamCallback) - <p>Optional callback, signature: err</p>

<a name="module_storage.crashSafeWriteFileLinesAsync"></a>

### storage.crashSafeWriteFileLinesAsync(filename, lines) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [crashSafeWriteFileLines](#module_storage.crashSafeWriteFileLines).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.crashSafeWriteFileLines  
**Params**

- filename <code>string</code>
- lines <code>Array.&lt;string&gt;</code>

<a name="module_storage.ensureDatafileIntegrity"></a>

### storage.ensureDatafileIntegrity(filename, callback)
<p>Ensure the datafile contains all the data, even if there was a crash during a full file write.</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**Params**

- filename <code>string</code>
- callback [<code>NoParamCallback</code>](#NoParamCallback) - <p>signature: err</p>

<a name="module_storage.ensureDatafileIntegrityAsync"></a>

### storage.ensureDatafileIntegrityAsync(filename) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [ensureDatafileIntegrity](#module_storage.ensureDatafileIntegrity).</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  
**See**: module:storage.ensureDatafileIntegrity  
**Params**

- filename <code>string</code>

<a name="module_storage..existsCallback"></a>

### storage~existsCallback : <code>function</code>
**Kind**: inner typedef of [<code>storage</code>](#module_storage)  
**Params**

- exists <code>boolean</code>

