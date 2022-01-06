<a name="Persistence"></a>

## Persistence
<p>Handle every persistence-related task</p>

**Kind**: global class  

* [Persistence](#Persistence)
    * [new Persistence()](#new_Persistence_new)
    * _instance_
        * [.persistCachedDatabase(callback)](#Persistence+persistCachedDatabase)
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


| Param | Type | Description |
| --- | --- | --- |
| options.db | [<code>Datastore</code>](#Datastore) |  |
| [options.corruptAlertThreshold] | <code>Number</code> | <p>Optional, threshold after which an alert is thrown if too much data is corrupt</p> |
| [options.nodeWebkitAppName] | <code>string</code> | <p>Optional, specify the name of your NW app if you want options.filename to be relative to the directory where Node Webkit stores application data such as cookies and local storage (the best place to store data in my opinion)</p> |
| [options.beforeDeserialization] | <code>function</code> | <p>Hook you can use to transform data after it was serialized and before it is written to disk.</p> |
| [options.afterSerialization] | <code>function</code> | <p>Inverse of <code>afterSerialization</code>.</p> |

<a name="Persistence+persistCachedDatabase"></a>

### persistence.persistCachedDatabase(callback)
<p>Persist cached database
This serves as a compaction function since the cache always contains only the number of documents in the collection
while the data file is append-only so it may grow larger
This is an internal function, use compactDataFile which uses the executor</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  

| Param | Type | Description |
| --- | --- | --- |
| callback | [<code>NoParamCallback</code>](#NoParamCallback) | <p>Optional callback, signature: err</p> |

<a name="Persistence+persistCachedDatabaseAsync"></a>

### persistence.persistCachedDatabaseAsync() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Persist cached database
This serves as a compaction function since the cache always contains only the number of documents in the collection
while the data file is append-only so it may grow larger
This is an internal function, use compactDataFileAsync which uses the executor</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
<a name="Persistence+compactDatafile"></a>

### persistence.compactDatafile([callback])
<p>Queue a rewrite of the datafile</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [callback] | [<code>NoParamCallback</code>](#NoParamCallback) | <code>() &#x3D;&gt; {}</code> | <p>Optional callback, signature: err</p> |

<a name="Persistence+compactDatafileAsync"></a>

### persistence.compactDatafileAsync()
<p>Queue a rewrite of the datafile</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
<a name="Persistence+setAutocompactionInterval"></a>

### persistence.setAutocompactionInterval(interval)
<p>Set automatic compaction every interval ms</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  

| Param | Type | Description |
| --- | --- | --- |
| interval | <code>Number</code> | <p>in milliseconds, with an enforced minimum of 5 seconds</p> |

<a name="Persistence+stopAutocompaction"></a>

### persistence.stopAutocompaction()
<p>Stop autocompaction (do nothing if autocompaction was not running)</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
<a name="Persistence+persistNewState"></a>

### persistence.persistNewState(newDocs, [callback])
<p>Persist new state for the given newDocs (can be insertion, update or removal)
Use an append-only format</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| newDocs | <code>Array.&lt;string&gt;</code> |  | <p>Can be empty if no doc was updated/removed</p> |
| [callback] | [<code>NoParamCallback</code>](#NoParamCallback) | <code>() &#x3D;&gt; {}</code> | <p>Optional, signature: err</p> |

<a name="Persistence+persistNewStateAsync"></a>

### persistence.persistNewStateAsync(newDocs) ⇒ <code>Promise</code>
<p>Persist new state for the given newDocs (can be insertion, update or removal)
Use an append-only format</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  

| Param | Type | Description |
| --- | --- | --- |
| newDocs | [<code>Array.&lt;document&gt;</code>](#document) | <p>Can be empty if no doc was updated/removed</p> |

<a name="Persistence+treatRawData"></a>

### persistence.treatRawData(rawData) ⇒ <code>Object</code>
<p>From a database's raw data, return the corresponding machine understandable collection</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  

| Param | Type | Description |
| --- | --- | --- |
| rawData | <code>string</code> | <p>database file</p> |

<a name="Persistence+treatRawStream"></a>

### persistence.treatRawStream(rawStream, cb)
<p>From a database's raw data stream, return the corresponding machine understandable collection</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  

| Param | Type |
| --- | --- |
| rawStream | <code>Readable</code> | 
| cb | [<code>treatRawStreamCallback</code>](#Persistence..treatRawStreamCallback) | 

<a name="Persistence+treatRawStreamAsync"></a>

### persistence.treatRawStreamAsync(rawStream) ⇒ <code>Promise.&lt;{data: Array.&lt;document&gt;, indexes: Object.&lt;string, rawIndex&gt;}&gt;</code>
<p>From a database's raw data stream, return the corresponding machine understandable collection</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  

| Param | Type |
| --- | --- |
| rawStream | <code>Readable</code> | 

<a name="Persistence+loadDatabase"></a>

### persistence.loadDatabase(callback)
<p>Load the database</p>
<ol>
<li>Create all indexes</li>
<li>Insert all data</li>
<li>Compact the database
This means pulling data out of the data file or creating it if it doesn't exist
Also, all data is persisted right away, which has the effect of compacting the database file
This operation is very quick at startup for a big collection (60ms for ~10k docs)</li>
</ol>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  

| Param | Type | Description |
| --- | --- | --- |
| callback | [<code>NoParamCallback</code>](#NoParamCallback) | <p>Optional callback, signature: err</p> |

<a name="Persistence+loadDatabaseAsync"></a>

### persistence.loadDatabaseAsync() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Load the database</p>
<ol>
<li>Create all indexes</li>
<li>Insert all data</li>
<li>Compact the database
This means pulling data out of the data file or creating it if it doesn't exist
Also, all data is persisted right away, which has the effect of compacting the database file
This operation is very quick at startup for a big collection (60ms for ~10k docs)</li>
</ol>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
<a name="Persistence.ensureDirectoryExists"></a>

### Persistence.ensureDirectoryExists(dir, [callback])
<p>Check if a directory stat and create it on the fly if it is not the case</p>

**Kind**: static method of [<code>Persistence</code>](#Persistence)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| dir | <code>string</code> |  |  |
| [callback] | [<code>NoParamCallback</code>](#NoParamCallback) | <code>() &#x3D;&gt; {}</code> | <p>optional callback, signature: err</p> |

<a name="Persistence.ensureDirectoryExistsAsync"></a>

### Persistence.ensureDirectoryExistsAsync(dir) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Check if a directory stat and create it on the fly if it is not the case</p>

**Kind**: static method of [<code>Persistence</code>](#Persistence)  

| Param | Type |
| --- | --- |
| dir | <code>string</code> | 

<a name="Persistence.getNWAppFilename"></a>

### ~~Persistence.getNWAppFilename(appName, relativeFilename) ⇒ <code>string</code>~~
***Deprecated***

<p>Return the path the datafile if the given filename is relative to the directory where Node Webkit stores
data for this application. Probably the best place to store data</p>

**Kind**: static method of [<code>Persistence</code>](#Persistence)  

| Param | Type |
| --- | --- |
| appName | <code>string</code> | 
| relativeFilename | <code>string</code> | 

<a name="Persistence..treatRawStreamCallback"></a>

### Persistence~treatRawStreamCallback : <code>function</code>
**Kind**: inner typedef of [<code>Persistence</code>](#Persistence)  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 
| data | <code>Object</code> | 

