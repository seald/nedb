<a name="module_storageBrowser"></a>

## storageBrowser
<p>Way data is stored for this database</p>
<p>This version is the browser version and uses [localforage](https://github.com/localForage/localForage) which chooses the best option depending on user browser (IndexedDB then WebSQL then localStorage).</p>

**See**

- module:storage
- module:storageReactNative


* [storageBrowser](#module_storageBrowser)
    * _static_
        * [.existsAsync(file)](#module_storageBrowser.existsAsync) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.exists(file, cb)](#module_storageBrowser.exists)
        * [.renameAsync(oldPath, newPath)](#module_storageBrowser.renameAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.rename(oldPath, newPath, c)](#module_storageBrowser.rename) ⇒ <code>void</code>
        * [.writeFileAsync(file, data, [options])](#module_storageBrowser.writeFileAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.writeFile(path, data, options, callback)](#module_storageBrowser.writeFile)
        * [.appendFileAsync(filename, toAppend, [options])](#module_storageBrowser.appendFileAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.appendFile(filename, toAppend, [options], callback)](#module_storageBrowser.appendFile)
        * [.readFileAsync(filename, [options])](#module_storageBrowser.readFileAsync) ⇒ <code>Promise.&lt;Buffer&gt;</code>
        * [.readFile(filename, options, callback)](#module_storageBrowser.readFile)
        * [.unlinkAsync(filename)](#module_storageBrowser.unlinkAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.unlink(path, callback)](#module_storageBrowser.unlink)
        * [.mkdirAsync(path, [options])](#module_storageBrowser.mkdirAsync) ⇒ <code>Promise.&lt;(void\|string)&gt;</code>
        * [.mkdir(path, options, callback)](#module_storageBrowser.mkdir)
        * [.ensureDatafileIntegrityAsync(filename)](#module_storageBrowser.ensureDatafileIntegrityAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.ensureDatafileIntegrity(filename, callback)](#module_storageBrowser.ensureDatafileIntegrity)
        * [.crashSafeWriteFileLinesAsync(filename, lines)](#module_storageBrowser.crashSafeWriteFileLinesAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.crashSafeWriteFileLines(filename, lines, [callback])](#module_storageBrowser.crashSafeWriteFileLines)
    * _inner_
        * [~existsCallback](#module_storageBrowser..existsCallback) : <code>function</code>

<a name="module_storageBrowser.existsAsync"></a>

### storageBrowser.existsAsync(file) ⇒ <code>Promise.&lt;boolean&gt;</code>
<p>Returns Promise<true> if file exists.</p>
<p>Async version of [exists](#module_storageBrowser.exists).</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**See**: module:storageBrowser.exists  
**Params**

- file <code>string</code>

<a name="module_storageBrowser.exists"></a>

### storageBrowser.exists(file, cb)
<p>Callback returns true if file exists.</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- file <code>string</code>
- cb [<code>existsCallback</code>](#module_storageBrowser..existsCallback)

<a name="module_storageBrowser.renameAsync"></a>

### storageBrowser.renameAsync(oldPath, newPath) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [rename](#module_storageBrowser.rename).</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**See**: module:storageBrowser.rename  
**Params**

- oldPath <code>string</code>
- newPath <code>string</code>

<a name="module_storageBrowser.rename"></a>

### storageBrowser.rename(oldPath, newPath, c) ⇒ <code>void</code>
<p>Moves the item from one path to another</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- oldPath <code>string</code>
- newPath <code>string</code>
- c [<code>NoParamCallback</code>](#NoParamCallback)

<a name="module_storageBrowser.writeFileAsync"></a>

### storageBrowser.writeFileAsync(file, data, [options]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [writeFile](#module_storageBrowser.writeFile).</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**See**: module:storageBrowser.writeFile  
**Params**

- file <code>string</code>
- data <code>string</code>
- [options] <code>object</code>

<a name="module_storageBrowser.writeFile"></a>

### storageBrowser.writeFile(path, data, options, callback)
<p>Saves the item at given path</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- path <code>string</code>
- data <code>string</code>
- options <code>object</code>
- callback <code>function</code>

<a name="module_storageBrowser.appendFileAsync"></a>

### storageBrowser.appendFileAsync(filename, toAppend, [options]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [appendFile](#module_storageBrowser.appendFile).</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**See**: module:storageBrowser.appendFile  
**Params**

- filename <code>string</code>
- toAppend <code>string</code>
- [options] <code>object</code>

<a name="module_storageBrowser.appendFile"></a>

### storageBrowser.appendFile(filename, toAppend, [options], callback)
<p>Append to the item at given path</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- filename <code>string</code>
- toAppend <code>string</code>
- [options] <code>object</code>
- callback <code>function</code>

<a name="module_storageBrowser.readFileAsync"></a>

### storageBrowser.readFileAsync(filename, [options]) ⇒ <code>Promise.&lt;Buffer&gt;</code>
<p>Async version of [readFile](#module_storageBrowser.readFile).</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**See**: module:storageBrowser.readFile  
**Params**

- filename <code>string</code>
- [options] <code>object</code>

<a name="module_storageBrowser.readFile"></a>

### storageBrowser.readFile(filename, options, callback)
<p>Read data at given path</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- filename <code>string</code>
- options <code>object</code>
- callback <code>function</code>

<a name="module_storageBrowser.unlinkAsync"></a>

### storageBrowser.unlinkAsync(filename) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [unlink](#module_storageBrowser.unlink).</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**See**: module:storageBrowser.unlink  
**Params**

- filename <code>string</code>

<a name="module_storageBrowser.unlink"></a>

### storageBrowser.unlink(path, callback)
<p>Remove the data at given path</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- path <code>string</code>
- callback <code>function</code>

<a name="module_storageBrowser.mkdirAsync"></a>

### storageBrowser.mkdirAsync(path, [options]) ⇒ <code>Promise.&lt;(void\|string)&gt;</code>
<p>Shim for [mkdirAsync](#module_storage.mkdirAsync), nothing to do, no directories will be used on the browser.</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- path <code>string</code>
- [options] <code>object</code>

<a name="module_storageBrowser.mkdir"></a>

### storageBrowser.mkdir(path, options, callback)
<p>Shim for [mkdir](#module_storage.mkdir), nothing to do, no directories will be used on the browser.</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- path <code>string</code>
- options <code>object</code>
- callback <code>function</code>

<a name="module_storageBrowser.ensureDatafileIntegrityAsync"></a>

### storageBrowser.ensureDatafileIntegrityAsync(filename) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Shim for [ensureDatafileIntegrityAsync](#module_storage.ensureDatafileIntegrityAsync), nothing to do, no data corruption possible in the browser.</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- filename <code>string</code>

<a name="module_storageBrowser.ensureDatafileIntegrity"></a>

### storageBrowser.ensureDatafileIntegrity(filename, callback)
<p>Shim for [ensureDatafileIntegrity](#module_storage.ensureDatafileIntegrity), nothing to do, no data corruption possible in the browser.</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- filename <code>string</code>
- callback [<code>NoParamCallback</code>](#NoParamCallback) - <p>signature: err</p>

<a name="module_storageBrowser.crashSafeWriteFileLinesAsync"></a>

### storageBrowser.crashSafeWriteFileLinesAsync(filename, lines) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [crashSafeWriteFileLines](#module_storageBrowser.crashSafeWriteFileLines).</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**See**: module:storageBrowser.crashSafeWriteFileLines  
**Params**

- filename <code>string</code>
- lines <code>Array.&lt;string&gt;</code>

<a name="module_storageBrowser.crashSafeWriteFileLines"></a>

### storageBrowser.crashSafeWriteFileLines(filename, lines, [callback])
<p>Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)</p>

**Kind**: static method of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- filename <code>string</code>
- lines <code>Array.&lt;string&gt;</code>
- [callback] [<code>NoParamCallback</code>](#NoParamCallback) - <p>Optional callback, signature: err</p>

<a name="module_storageBrowser..existsCallback"></a>

### storageBrowser~existsCallback : <code>function</code>
**Kind**: inner typedef of [<code>storageBrowser</code>](#module_storageBrowser)  
**Params**

- exists <code>boolean</code>

