<a name="Persistence"></a>

## Persistence
<p>Handle every persistence-related task</p>

**Kind**: global class  

* [Persistence](#Persistence)
    * [new Persistence()](#new_Persistence_new)
    * _instance_
        * [.persistCachedDatabase([callback])](#Persistence+persistCachedDatabase)
        * [.persistCachedDatabaseAsync()](#Persistence+persistCachedDatabaseAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.compactDatafile([callback])](#Persistence+compactDatafile)
        * [.compactDatafileAsync()](#Persistence+compactDatafileAsync)
        * [.setAutocompactionInterval(interval)](#Persistence+setAutocompactionInterval)
        * [.stopAutocompaction()](#Persistence+stopAutocompaction)
        * [.persistNewState(newDocs, [callback])](#Persistence+persistNewState)
        * [.persistNewStateAsync(newDocs)](#Persistence+persistNewStateAsync) ⇒ <code>Promise</code>
        * [.treatRawData(rawData)](#Persistence+treatRawData) ⇒ <code>Object</code>
        * [.treatRawStream(rawStream, cb)](#Persistence+treatRawStream)
        * [.treatRawStreamAsync(rawStream)](#Persistence+treatRawStreamAsync) ⇒ <code>Promise.&lt;{data: Array.&lt;document&gt;, indexes: Object.&lt;string, rawIndex&gt;}&gt;</code>
        * [.loadDatabase(callback)](#Persistence+loadDatabase)
        * [.loadDatabaseAsync()](#Persistence+loadDatabaseAsync) ⇒ <code>Promise.&lt;void&gt;</code>
    * _static_
        * [.ensureDirectoryExists(dir, [callback])](#Persistence.ensureDirectoryExists)
        * [.ensureDirectoryExistsAsync(dir)](#Persistence.ensureDirectoryExistsAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * ~~[.getNWAppFilename(appName, relativeFilename)](#Persistence.getNWAppFilename) ⇒ <code>string</code>~~
    * _inner_
        * [~treatRawStreamCallback](#Persistence..treatRawStreamCallback) : <code>function</code>

<a name="new_Persistence_new"></a>

### new Persistence()
<p>Create a new Persistence object for database options.db</p>

**Params**

    - .db [<code>Datastore</code>](#Datastore)
    - [.corruptAlertThreshold] <code>Number</code> - <p>Optional, threshold after which an alert is thrown if too much data is corrupt</p>
    - [.nodeWebkitAppName] <code>string</code> - <p>Optional, specify the name of your NW app if you want options.filename to be relative to the directory where Node Webkit stores application data such as cookies and local storage (the best place to store data in my opinion)</p>
    - [.beforeDeserialization] [<code>serializationHook</code>](#serializationHook) - <p>Hook you can use to transform data after it was serialized and before it is written to disk.</p>
    - [.afterSerialization] [<code>serializationHook</code>](#serializationHook) - <p>Inverse of <code>afterSerialization</code>.</p>

<a name="Persistence+persistCachedDatabase"></a>

### persistence.persistCachedDatabase([callback])
<p>Persist cached database
This serves as a compaction function since the cache always contains only the number of documents in the collection
while the data file is append-only so it may grow larger</p>
<p>This is an internal function, use [compactDatafile](#Persistence+compactDatafile) which uses the [executor](#Datastore+executor).</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Access**: protected  
**Params**

- [callback] [<code>NoParamCallback</code>](#NoParamCallback) <code> = () &#x3D;&gt; {}</code>

<a name="Persistence+persistCachedDatabaseAsync"></a>

### persistence.persistCachedDatabaseAsync() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [persistCachedDatabase](#Persistence+persistCachedDatabase).</p>
<p>This is an internal function, use [compactDatafileAsync](#Persistence+compactDatafileAsync) which uses the [executor](#Datastore+executor).</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Access**: protected  
**See**: Persistence#persistCachedDatabase  
<a name="Persistence+compactDatafile"></a>

### persistence.compactDatafile([callback])
<p>Queue a rewrite of the datafile</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**See**: Persistence#persistCachedDatabase  
**Params**

- [callback] [<code>NoParamCallback</code>](#NoParamCallback) <code> = () &#x3D;&gt; {}</code>

<a name="Persistence+compactDatafileAsync"></a>

### persistence.compactDatafileAsync()
<p>Async version of [compactDatafile](#Persistence+compactDatafile).</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**See**: Persistence#compactDatafile  
<a name="Persistence+setAutocompactionInterval"></a>

### persistence.setAutocompactionInterval(interval)
<p>Set automatic compaction every <code>interval</code> ms</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Params**

- interval <code>Number</code> - <p>in milliseconds, with an enforced minimum of 5000 milliseconds</p>

<a name="Persistence+stopAutocompaction"></a>

### persistence.stopAutocompaction()
<p>Stop autocompaction (do nothing if automatic compaction was not running)</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
<a name="Persistence+persistNewState"></a>

### persistence.persistNewState(newDocs, [callback])
<p>Persist new state for the given newDocs (can be insertion, update or removal)
Use an append-only format</p>
<p>Do not use directly, it should only used by a [Datastore](#Datastore) instance.</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Access**: protected  
**Params**

- newDocs <code>Array.&lt;string&gt;</code> - <p>Can be empty if no doc was updated/removed</p>
- [callback] [<code>NoParamCallback</code>](#NoParamCallback) <code> = () &#x3D;&gt; {}</code>

<a name="Persistence+persistNewStateAsync"></a>

### persistence.persistNewStateAsync(newDocs) ⇒ <code>Promise</code>
<p>Async version of [persistNewState](#Persistence+persistNewState)</p>
<p>Do not use directly, it should only used by a [Datastore](#Datastore) instance.</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**See**: Persistence#persistNewState  
**Params**

- newDocs [<code>Array.&lt;document&gt;</code>](#document) - <p>Can be empty if no doc was updated/removed</p>

<a name="Persistence+treatRawData"></a>

### persistence.treatRawData(rawData) ⇒ <code>Object</code>
<p>From a database's raw data, return the corresponding machine understandable collection.</p>
<p>Do not use directly, it should only used by a [Datastore](#Datastore) instance.</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Access**: protected  
**Params**

- rawData <code>string</code> - <p>database file</p>

<a name="Persistence+treatRawStream"></a>

### persistence.treatRawStream(rawStream, cb)
<p>From a database's raw data stream, return the corresponding machine understandable collection
Is only used by a [Datastore](#Datastore) instance.</p>
<p>Is only used in the Node.js version, since [React-Native](#module_storageReactNative) &amp;
[browser](#module_storageBrowser) storage modules don't provide an equivalent of
[readFileStream](#module_storage.readFileStream).</p>
<p>Do not use directly, it should only used by a [Datastore](#Datastore) instance.</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Access**: protected  
**Params**

- rawStream <code>Readable</code>
- cb [<code>treatRawStreamCallback</code>](#Persistence..treatRawStreamCallback)

<a name="Persistence+treatRawStreamAsync"></a>

### persistence.treatRawStreamAsync(rawStream) ⇒ <code>Promise.&lt;{data: Array.&lt;document&gt;, indexes: Object.&lt;string, rawIndex&gt;}&gt;</code>
<p>Async version of [treatRawStream](#Persistence+treatRawStream).</p>
<p>Do not use directly, it should only used by a [Datastore](#Datastore) instance.</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Access**: protected  
**See**: Persistence#treatRawStream  
**Params**

- rawStream <code>Readable</code>

<a name="Persistence+loadDatabase"></a>

### persistence.loadDatabase(callback)
<p>Load the database</p>
<ol>
<li>Create all indexes</li>
<li>Insert all data</li>
<li>Compact the database</li>
</ol>
<p>This means pulling data out of the data file or creating it if it doesn't exist
Also, all data is persisted right away, which has the effect of compacting the database file
This operation is very quick at startup for a big collection (60ms for ~10k docs)</p>
<p>Do not use directly as it does not use the [Executor](Datastore.executor), use [loadDatabase](#Datastore+loadDatabase) instead.</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Access**: protected  
**Params**

- callback [<code>NoParamCallback</code>](#NoParamCallback)

<a name="Persistence+loadDatabaseAsync"></a>

### persistence.loadDatabaseAsync() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [loadDatabase](#Persistence+loadDatabase)</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**See**: Persistence#loadDatabase  
<a name="Persistence.ensureDirectoryExists"></a>

### Persistence.ensureDirectoryExists(dir, [callback])
<p>Check if a directory stat and create it on the fly if it is not the case.</p>

**Kind**: static method of [<code>Persistence</code>](#Persistence)  
**Params**

- dir <code>string</code>
- [callback] [<code>NoParamCallback</code>](#NoParamCallback) <code> = () &#x3D;&gt; {}</code>

<a name="Persistence.ensureDirectoryExistsAsync"></a>

### Persistence.ensureDirectoryExistsAsync(dir) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [ensureDirectoryExists](#Persistence.ensureDirectoryExists).</p>

**Kind**: static method of [<code>Persistence</code>](#Persistence)  
**See**: Persistence.ensureDirectoryExists  
**Params**

- dir <code>string</code>

<a name="Persistence.getNWAppFilename"></a>

### ~~Persistence.getNWAppFilename(appName, relativeFilename) ⇒ <code>string</code>~~
***Deprecated***

<p>Return the path the datafile if the given filename is relative to the directory where Node Webkit stores
data for this application. Probably the best place to store data</p>

**Kind**: static method of [<code>Persistence</code>](#Persistence)  
**Params**

- appName <code>string</code>
- relativeFilename <code>string</code>

<a name="Persistence..treatRawStreamCallback"></a>

### Persistence~treatRawStreamCallback : <code>function</code>
**Kind**: inner typedef of [<code>Persistence</code>](#Persistence)  
**Params**

- err <code>Error</code>
- data <code>object</code>
    - .data [<code>Array.&lt;document&gt;</code>](#document)
    - .indexes <code>Object.&lt;string, rawIndex&gt;</code>

