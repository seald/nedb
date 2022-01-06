<a name="module_storageReactNative"></a>

## storageReactNative
<p>Way data is stored for this database
For a Node.js/Node Webkit database it's the file system
For a browser-side database it's localforage, which uses the best backend available (IndexedDB then WebSQL then localStorage)
For a react-native database, we use @react-native-async-storage/async-storage</p>
<p>This version is the react-native version</p>


* [storageReactNative](#module_storageReactNative)
    * _static_
        * [.existsAsync(file)](#module_storageReactNative.existsAsync) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.exists(file, cb)](#module_storageReactNative.exists)
        * [.renameAsync(oldPath, newPath)](#module_storageReactNative.renameAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.rename(oldPath, newPath, c)](#module_storageReactNative.rename) ⇒ <code>void</code>
        * [.writeFileAsync(file, data, [options])](#module_storageReactNative.writeFileAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.writeFile(path, data, options, callback)](#module_storageReactNative.writeFile)
        * [.appendFileAsync(filename, toAppend, [options])](#module_storageReactNative.appendFileAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.appendFile(filename, toAppend, [options], callback)](#module_storageReactNative.appendFile)
        * [.readFileAsync(filename, [options])](#module_storageReactNative.readFileAsync) ⇒ <code>Promise.&lt;string&gt;</code>
        * [.readFile(filename, options, callback)](#module_storageReactNative.readFile)
        * [.unlinkAsync(filename)](#module_storageReactNative.unlinkAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.unlink(path, callback)](#module_storageReactNative.unlink)
        * [.mkdirAsync(dir, [options])](#module_storageReactNative.mkdirAsync) ⇒ <code>Promise.&lt;(void\|string)&gt;</code>
        * [.mkdir(path, options, callback)](#module_storageReactNative.mkdir)
        * [.ensureDatafileIntegrityAsync(filename)](#module_storageReactNative.ensureDatafileIntegrityAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.ensureDatafileIntegrity(filename, callback)](#module_storageReactNative.ensureDatafileIntegrity)
        * [.crashSafeWriteFileLinesAsync(filename, lines)](#module_storageReactNative.crashSafeWriteFileLinesAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.crashSafeWriteFileLines(filename, lines, [callback])](#module_storageReactNative.crashSafeWriteFileLines)
    * _inner_
        * [~existsCallback](#module_storageReactNative..existsCallback) : <code>function</code>

<a name="module_storageReactNative.existsAsync"></a>

### storageReactNative.existsAsync(file) ⇒ <code>Promise.&lt;boolean&gt;</code>
<p>Returns Promise<true> if file exists</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| file | <code>string</code> | 

<a name="module_storageReactNative.exists"></a>

### storageReactNative.exists(file, cb)
<p>Callback returns true if file exists</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| file | <code>string</code> | 
| cb | [<code>existsCallback</code>](#module_storageReactNative..existsCallback) | 

<a name="module_storageReactNative.renameAsync"></a>

### storageReactNative.renameAsync(oldPath, newPath) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Moves the item from one path to another</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| oldPath | <code>string</code> | 
| newPath | <code>string</code> | 

<a name="module_storageReactNative.rename"></a>

### storageReactNative.rename(oldPath, newPath, c) ⇒ <code>void</code>
<p>Moves the item from one path to another</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| oldPath | <code>string</code> | 
| newPath | <code>string</code> | 
| c | [<code>NoParamCallback</code>](#NoParamCallback) | 

<a name="module_storageReactNative.writeFileAsync"></a>

### storageReactNative.writeFileAsync(file, data, [options]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Saves the item at given path</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| file | <code>string</code> | 
| data | <code>string</code> | 
| [options] | <code>object</code> | 

<a name="module_storageReactNative.writeFile"></a>

### storageReactNative.writeFile(path, data, options, callback)
<p>Saves the item at given path</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| data | <code>string</code> | 
| options | <code>object</code> | 
| callback | <code>function</code> | 

<a name="module_storageReactNative.appendFileAsync"></a>

### storageReactNative.appendFileAsync(filename, toAppend, [options]) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Append to the item at given path</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 
| toAppend | <code>string</code> | 
| [options] | <code>object</code> | 

<a name="module_storageReactNative.appendFile"></a>

### storageReactNative.appendFile(filename, toAppend, [options], callback)
<p>Append to the item at given path</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 
| toAppend | <code>string</code> | 
| [options] | <code>object</code> | 
| callback | <code>function</code> | 

<a name="module_storageReactNative.readFileAsync"></a>

### storageReactNative.readFileAsync(filename, [options]) ⇒ <code>Promise.&lt;string&gt;</code>
<p>Read data at given path</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 
| [options] | <code>object</code> | 

<a name="module_storageReactNative.readFile"></a>

### storageReactNative.readFile(filename, options, callback)
<p>Read data at given path</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 
| options | <code>object</code> | 
| callback | <code>function</code> | 

<a name="module_storageReactNative.unlinkAsync"></a>

### storageReactNative.unlinkAsync(filename) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Remove the data at given path</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 

<a name="module_storageReactNative.unlink"></a>

### storageReactNative.unlink(path, callback)
<p>Remove the data at given path</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| callback | <code>function</code> | 

<a name="module_storageReactNative.mkdirAsync"></a>

### storageReactNative.mkdirAsync(dir, [options]) ⇒ <code>Promise.&lt;(void\|string)&gt;</code>
<p>Shim for storage.mkdirAsync, nothing to do, no directories will be used on the browser</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| dir | <code>string</code> | 
| [options] | <code>object</code> | 

<a name="module_storageReactNative.mkdir"></a>

### storageReactNative.mkdir(path, options, callback)
<p>Shim for storage.mkdir, nothing to do, no directories will be used on the browser</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 
| options | <code>object</code> | 
| callback | <code>function</code> | 

<a name="module_storageReactNative.ensureDatafileIntegrityAsync"></a>

### storageReactNative.ensureDatafileIntegrityAsync(filename) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Ensure the datafile contains all the data, even if there was a crash during a full file write
Nothing to do, no data corruption possible in the browser</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 

<a name="module_storageReactNative.ensureDatafileIntegrity"></a>

### storageReactNative.ensureDatafileIntegrity(filename, callback)
<p>Ensure the datafile contains all the data, even if there was a crash during a full file write
Nothing to do, no data corruption possible in the browser</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> |  |
| callback | [<code>NoParamCallback</code>](#NoParamCallback) | <p>signature: err</p> |

<a name="module_storageReactNative.crashSafeWriteFileLinesAsync"></a>

### storageReactNative.crashSafeWriteFileLinesAsync(filename, lines) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| filename | <code>string</code> | 
| lines | <code>Array.&lt;string&gt;</code> | 

<a name="module_storageReactNative.crashSafeWriteFileLines"></a>

### storageReactNative.crashSafeWriteFileLines(filename, lines, [callback])
<p>Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)</p>

**Kind**: static method of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> |  |
| lines | <code>Array.&lt;string&gt;</code> |  |
| [callback] | [<code>NoParamCallback</code>](#NoParamCallback) | <p>Optional callback, signature: err</p> |

<a name="module_storageReactNative..existsCallback"></a>

### storageReactNative~existsCallback : <code>function</code>
**Kind**: inner typedef of [<code>storageReactNative</code>](#module_storageReactNative)  

| Param | Type |
| --- | --- |
| exists | <code>boolean</code> | 

