<a name="module_storage"></a>

## storage
<p>Way data is stored for this database
For a Node.js/Node Webkit database it's the file system
For a browser-side database it's localforage, which uses the best backend available (IndexedDB then WebSQL then localStorage)
For a react-native database, we use @react-native-async-storage/async-storage</p>
<p>This version is the Node.js/Node Webkit version
It's essentially fs, mkdirp and crash safe write and read functions</p>


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
        * [.writeFileLines(filename, lines, callback)](#module_storage.writeFileLines)
        * [.writeFileLinesAsync(filename, lines)](#module_storage.writeFileLinesAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.crashSafeWriteFileLines(filename, lines, [callback])](#module_storage.crashSafeWriteFileLines)
        * [.crashSafeWriteFileLinesAsync(filename, lines)](#module_storage.crashSafeWriteFileLinesAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.ensureDatafileIntegrity(filename, callback)](#module_storage.ensureDatafileIntegrity)
        * [.ensureDatafileIntegrityAsync(filename)](#module_storage.ensureDatafileIntegrityAsync) ⇒ <code>Promise.&lt;void&gt;</code>
    * _inner_
        * [~existsCallback](#module_storage..existsCallback) : <code>function</code>

<a name="module_storage.exists"></a>

### storage.exists(file, cb)
<p>Callback returns true if file exists</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| file | <code>string</code> | 
| cb | [<code>existsCallback</code>](#module_storage..existsCallback) | 

<a name="module_storage.existsAsync"></a>

### storage.existsAsync(file) ⇒ <code>Promise.&lt;boolean&gt;</code>
<p>Returns Promise<true> if file exists</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| file | <code>string</code> | 

<a name="module_storage.rename"></a>

### storage.rename(oldPath, newPath, c) ⇒ <code>void</code>
<p>Node.js' fs.rename</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| oldPath | <code>string</code> | 
| newPath | <code>string</code> | 
| c | [<code>NoParamCallback</code>](#NoParamCallback) | 

<a name="module_storage.renameAsync"></a>

### storage.renameAsync(oldPath, newPath) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Node.js' fs.promises.rename</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| oldPath | <code>string</code> | 
| newPath | <code>string</code> | 

<a name="module_storage.writeFile"></a>

### storage.writeFile(path, data, options, callback)
<p>Node.js' fs.writeFile</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| data | <code>string</code> | 
| options | <code>object</code> | 
| callback | <code>function</code> | 

<a name="module_storage.writeFileAsync"></a>

### storage.writeFileAsync(path, data, [options]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Node.js' fs.promises.writeFile</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| data | <code>string</code> | 
| [options] | <code>object</code> | 

<a name="module_storage.writeFileStream"></a>

### storage.writeFileStream(path, [options]) ⇒ <code>fs.WriteStream</code>
<p>Node.js' fs.createWriteStream</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| [options] | <code>Object</code> | 

<a name="module_storage.unlink"></a>

### storage.unlink(path, callback)
<p>Node.js' fs.unlink</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| callback | <code>function</code> | 

<a name="module_storage.unlinkAsync"></a>

### storage.unlinkAsync(path) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Node.js' fs.promises.unlink</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 

<a name="module_storage.appendFile"></a>

### storage.appendFile(path, data, options, callback)
<p>Node.js' fs.appendFile</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| data | <code>string</code> | 
| options | <code>object</code> | 
| callback | <code>function</code> | 

<a name="module_storage.appendFileAsync"></a>

### storage.appendFileAsync(path, data, [options]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Node.js' fs.promises.appendFile</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| data | <code>string</code> | 
| [options] | <code>object</code> | 

<a name="module_storage.readFile"></a>

### storage.readFile(path, options, callback)
<p>Node.js' fs.readFile</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| options | <code>object</code> | 
| callback | <code>function</code> | 

<a name="module_storage.readFileAsync"></a>

### storage.readFileAsync(path, [options]) ⇒ <code>Promise.&lt;Buffer&gt;</code>
<p>Node.js' fs.promises.readFile</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| [options] | <code>object</code> | 

<a name="module_storage.readFileStream"></a>

### storage.readFileStream(path, [options]) ⇒ <code>fs.ReadStream</code>
<p>Node.js' fs.createReadStream</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| [options] | <code>Object</code> | 

<a name="module_storage.mkdir"></a>

### storage.mkdir(path, options, callback)
<p>Node.js' fs.mkdir</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| options | <code>object</code> | 
| callback | <code>function</code> | 

<a name="module_storage.mkdirAsync"></a>

### storage.mkdirAsync(path, options) ⇒ <code>Promise.&lt;(void\|string)&gt;</code>
<p>Node.js' fs.promises.mkdir</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| options | <code>object</code> | 

<a name="module_storage.ensureFileDoesntExistAsync"></a>

### storage.ensureFileDoesntExistAsync(file) ⇒ <code>Promise.&lt;void&gt;</code>
**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| file | <code>string</code> | 

<a name="module_storage.ensureFileDoesntExist"></a>

### storage.ensureFileDoesntExist(file, callback)
**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| file | <code>string</code> | 
| callback | [<code>NoParamCallback</code>](#NoParamCallback) | 

<a name="module_storage.flushToStorage"></a>

### storage.flushToStorage(options, callback)
<p>Flush data in OS buffer to storage if corresponding option is set</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> \| <code>string</code> |  | <p>If options is a string, it is assumed that the flush of the file (not dir) called options was requested</p> |
| [options.filename] | <code>string</code> |  |  |
| [options.isDir] | <code>boolean</code> | <code>false</code> | <p>Optional, defaults to false</p> |
| callback | [<code>NoParamCallback</code>](#NoParamCallback) |  |  |

<a name="module_storage.flushToStorageAsync"></a>

### storage.flushToStorageAsync(options) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Flush data in OS buffer to storage if corresponding option is set</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> \| <code>string</code> |  | <p>If options is a string, it is assumed that the flush of the file (not dir) called options was requested</p> |
| [options.filename] | <code>string</code> |  |  |
| [options.isDir] | <code>boolean</code> | <code>false</code> | <p>Optional, defaults to false</p> |

<a name="module_storage.writeFileLines"></a>

### storage.writeFileLines(filename, lines, callback)
<p>Fully write or rewrite the datafile</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 
| lines | <code>Array.&lt;string&gt;</code> | 
| callback | [<code>NoParamCallback</code>](#NoParamCallback) | 

<a name="module_storage.writeFileLinesAsync"></a>

### storage.writeFileLinesAsync(filename, lines) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Fully write or rewrite the datafile</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 
| lines | <code>Array.&lt;string&gt;</code> | 

<a name="module_storage.crashSafeWriteFileLines"></a>

### storage.crashSafeWriteFileLines(filename, lines, [callback])
<p>Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> |  |
| lines | <code>Array.&lt;string&gt;</code> |  |
| [callback] | [<code>NoParamCallback</code>](#NoParamCallback) | <p>Optional callback, signature: err</p> |

<a name="module_storage.crashSafeWriteFileLinesAsync"></a>

### storage.crashSafeWriteFileLinesAsync(filename, lines) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 
| lines | <code>Array.&lt;string&gt;</code> | 

<a name="module_storage.ensureDatafileIntegrity"></a>

### storage.ensureDatafileIntegrity(filename, callback)
<p>Ensure the datafile contains all the data, even if there was a crash during a full file write</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> |  |
| callback | [<code>NoParamCallback</code>](#NoParamCallback) | <p>signature: err</p> |

<a name="module_storage.ensureDatafileIntegrityAsync"></a>

### storage.ensureDatafileIntegrityAsync(filename) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Ensure the datafile contains all the data, even if there was a crash during a full file write</p>

**Kind**: static method of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 

<a name="module_storage..existsCallback"></a>

### storage~existsCallback : <code>function</code>
**Kind**: inner typedef of [<code>storage</code>](#module_storage)  

| Param | Type |
| --- | --- |
| exists | <code>boolean</code> | 

