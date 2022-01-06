<a name="Datastore"></a>

## Datastore ⇐ <code>EventEmitter</code>
<p>The <code>Datastore</code> class is the main class of NeDB.</p>

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  
**Emits**: <code>Datastore.event:&quot;compaction.done&quot;</code>  

* [Datastore](#Datastore) ⇐ <code>EventEmitter</code>
    * [new Datastore(options)](#new_Datastore_new)
    * _instance_
        * [.persistence](#Datastore+persistence) : [<code>Persistence</code>](#Persistence)
        * [.executor](#Datastore+executor) : [<code>Executor</code>](#Executor)
        * [.autoloadPromise](#Datastore+autoloadPromise) : <code>Promise</code>
        * [.loadDatabase(callback)](#Datastore+loadDatabase)
        * [.loadDatabaseAsync()](#Datastore+loadDatabaseAsync) ⇒ <code>Promise</code>
        * [.getAllData()](#Datastore+getAllData) ⇒ [<code>Array.&lt;document&gt;</code>](#document)
        * [.resetIndexes()](#Datastore+resetIndexes)
        * [.ensureIndex(options, callback)](#Datastore+ensureIndex)
        * [.ensureIndexAsync(options)](#Datastore+ensureIndexAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.removeIndex(fieldName, callback)](#Datastore+removeIndex)
        * [.removeIndexAsync(fieldName)](#Datastore+removeIndexAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.removeFromIndexes(doc)](#Datastore+removeFromIndexes)
        * [.updateIndexes(oldDoc, [newDoc])](#Datastore+updateIndexes)
        * [.insertAsync(newDoc)](#Datastore+insertAsync) ⇒ [<code>Promise.&lt;document&gt;</code>](#document)
        * [.count(query, [callback])](#Datastore+count) ⇒ <code>Cursor.&lt;number&gt;</code> \| <code>undefined</code>
        * [.countAsync(query)](#Datastore+countAsync) ⇒ <code>Cursor.&lt;number&gt;</code>
        * [.find(query, [projection], [callback])](#Datastore+find) ⇒ <code>Cursor.&lt;Array.&lt;document&gt;&gt;</code> \| <code>undefined</code>
        * [.findAsync(query, [projection])](#Datastore+findAsync) ⇒ <code>Cursor.&lt;Array.&lt;document&gt;&gt;</code>
        * [.findOne(query, projection, callback)](#Datastore+findOne) ⇒ [<code>Cursor.&lt;document&gt;</code>](#document) \| <code>undefined</code>
        * [.findOneAsync(query, projection)](#Datastore+findOneAsync) ⇒ [<code>Cursor.&lt;document&gt;</code>](#document)
        * [.update(query, update, [options], [cb])](#Datastore+update)
        * [.updateAsync(query, update, [options])](#Datastore+updateAsync) ⇒ <code>Promise.&lt;{numAffected: number, affectedDocuments: (Array.&lt;document&gt;\|document\|null), upsert: boolean}&gt;</code>
        * [.remove(query, [options], [cb])](#Datastore+remove)
        * [.removeAsync(query, [options])](#Datastore+removeAsync) ⇒ <code>Promise.&lt;number&gt;</code>
    * _static_
        * ["event:compaction.done"](#Datastore.event_compaction.done)
    * _inner_
        * [~countCallback](#Datastore..countCallback) : <code>function</code>
        * [~findOneCallback](#Datastore..findOneCallback) : <code>function</code>
        * [~updateCallback](#Datastore..updateCallback) : <code>function</code>
        * [~removeCallback](#Datastore..removeCallback) : <code>function</code>

<a name="new_Datastore_new"></a>

### new Datastore(options)
<p>Create a new collection, either persistent or in-memory.</p>
<p>If you use a persistent datastore without the <code>autoload</code> option, you need to call <code>loadDatabase</code> manually. This
function fetches the data from datafile and prepares the database. <strong>Don't forget it!</strong> If you use a persistent
datastore, no command (insert, find, update, remove) will be executed before <code>loadDatabase</code> is called, so make sure
to call it yourself or use the <code>autoload</code> option.</p>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> \| <code>string</code> |  | <p>Can be an object or a string. If options is a string, the behavior is the same as in v0.6: it will be interpreted as <code>options.filename</code>. <strong>Giving a string is deprecated, and will be removed in the next major version.</strong></p> |
| [options.filename] | <code>string</code> | <code>null</code> | <p>Path to the file where the data is persisted. If left blank, the datastore is automatically considered in-memory only. It cannot end with a <code>~</code> which is used in the temporary files NeDB uses to perform crash-safe writes.</p> |
| [options.inMemoryOnly] | <code>boolean</code> | <code>false</code> | <p>If set to true, no data will be written in storage.</p> |
| [options.timestampData] | <code>boolean</code> | <code>false</code> | <p>If set to true, createdAt and updatedAt will be created and populated automatically (if not specified by user)</p> |
| [options.autoload] | <code>boolean</code> | <code>false</code> | <p>If used, the database will automatically be loaded from the datafile upon creation (you don't need to call <code>loadDatabase</code>). Any command issued before load is finished is buffered and will be executed when load is done. When autoloading is done, you can either use the <code>onload</code> callback, or you can use <code>this.autoloadPromise</code> which resolves (or rejects) when autloading is done.</p> |
| [options.onload] | <code>function</code> |  | <p>If you use autoloading, this is the handler called after the <code>loadDatabase</code>. It takes one <code>error</code> argument. If you use autoloading without specifying this handler, and an error happens during load, an error will be thrown.</p> |
| [options.beforeDeserialization] | <code>function</code> |  | <p>Hook you can use to transform data after it was serialized and before it is written to disk. Can be used for example to encrypt data before writing database to disk. This function takes a string as parameter (one line of an NeDB data file) and outputs the transformed string, <strong>which must absolutely not contain a <code>\n</code> character</strong> (or data will be lost).</p> |
| [options.afterSerialization] | <code>function</code> |  | <p>Inverse of <code>afterSerialization</code>. Make sure to include both and not just one, or you risk data loss. For the same reason, make sure both functions are inverses of one another. Some failsafe mechanisms are in place to prevent data loss if you misuse the serialization hooks: NeDB checks that never one is declared without the other, and checks that they are reverse of one another by testing on random strings of various lengths. In addition, if too much data is detected as corrupt, NeDB will refuse to start as it could mean you're not using the deserialization hook corresponding to the serialization hook used before.</p> |
| [options.corruptAlertThreshold] | <code>number</code> | <code>0.1</code> | <p>Between 0 and 1, defaults to 10%. NeDB will refuse to start if more than this percentage of the datafile is corrupt. 0 means you don't tolerate any corruption, 1 means you don't care.</p> |
| [options.compareStrings] | [<code>compareStrings</code>](#compareStrings) |  | <p>If specified, it overrides default string comparison which is not well adapted to non-US characters in particular accented letters. Native <code>localCompare</code> will most of the time be the right choice.</p> |
| [options.nodeWebkitAppName] | <code>string</code> |  | <p><strong>Deprecated:</strong> if you are using NeDB from whithin a Node Webkit app, specify its name (the same one you use in the <code>package.json</code>) in this field and the <code>filename</code> will be relative to the directory Node Webkit uses to store the rest of the application's data (local storage etc.). It works on Linux, OS X and Windows. Now that you can use <code>require('nw.gui').App.dataPath</code> in Node Webkit to get the path to the data directory for your application, you should not use this option anymore and it will be removed.</p> |

<a name="Datastore+persistence"></a>

### datastore.persistence : [<code>Persistence</code>](#Persistence)
<p>The <code>Persistence</code> instance for this <code>Datastore</code>.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
<a name="Datastore+executor"></a>

### datastore.executor : [<code>Executor</code>](#Executor)
<p>The <code>Executor</code> instance for this <code>Datastore</code>. It is used in all methods exposed by the <code>Datastore</code>, any <code>Cursor</code>
produced by the <code>Datastore</code> and by <code>this.persistence.compactDataFile</code> &amp; <code>this.persistence.compactDataFileAsync</code>
to ensure operations are performed sequentially in the database.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
<a name="Datastore+autoloadPromise"></a>

### datastore.autoloadPromise : <code>Promise</code>
<p>A Promise that resolves when the autoload has finished.</p>
<p>The onload callback is not awaited by this Promise, it is started immediately after that.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
<a name="Datastore+loadDatabase"></a>

### datastore.loadDatabase(callback)
<p>Load the database from the datafile, and trigger the execution of buffered commands if any.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type |
| --- | --- |
| callback | <code>function</code> | 

<a name="Datastore+loadDatabaseAsync"></a>

### datastore.loadDatabaseAsync() ⇒ <code>Promise</code>
<p>Load the database from the datafile, and trigger the execution of buffered commands if any.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
<a name="Datastore+getAllData"></a>

### datastore.getAllData() ⇒ [<code>Array.&lt;document&gt;</code>](#document)
<p>Get an array of all the data in the database</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
<a name="Datastore+resetIndexes"></a>

### datastore.resetIndexes()
<p>Reset all currently defined indexes</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
<a name="Datastore+ensureIndex"></a>

### datastore.ensureIndex(options, callback)
<p>Ensure an index is kept for this field. Same parameters as lib/indexes
This function acts synchronously on the indexes, however the persistence of the indexes is deferred with the
executor.
Previous versions said explicitly the callback was optional, it is now recommended setting one.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| options.fieldName | <code>string</code> |  | <p>Name of the field to index. Use the dot notation to index a field in a nested document.</p> |
| [options.unique] | <code>boolean</code> | <code>false</code> | <p>Enforce field uniqueness. Note that a unique index will raise an error if you try to index two documents for which the field is not defined.</p> |
| [options.sparse] | <code>boolean</code> | <code>false</code> | <p>don't index documents for which the field is not defined. Use this option along with &quot;unique&quot; if you want to accept multiple documents for which it is not defined.</p> |
| [options.expireAfterSeconds] | <code>number</code> |  | <p>if set, the created index is a TTL (time to live) index, that will automatically remove documents when the system date becomes larger than the date on the indexed field plus <code>expireAfterSeconds</code>. Documents where the indexed field is not specified or not a <code>Date</code> object are ignored</p> |
| callback | [<code>NoParamCallback</code>](#NoParamCallback) |  | <p>Callback, signature: err</p> |

<a name="Datastore+ensureIndexAsync"></a>

### datastore.ensureIndexAsync(options) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Ensure an index is kept for this field. Same parameters as lib/indexes
This function acts synchronously on the indexes, however the persistence of the indexes is deferred with the
executor.
Previous versions said explicitly the callback was optional, it is now recommended setting one.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| options.fieldName | <code>string</code> |  | <p>Name of the field to index. Use the dot notation to index a field in a nested document.</p> |
| [options.unique] | <code>boolean</code> | <code>false</code> | <p>Enforce field uniqueness. Note that a unique index will raise an error if you try to index two documents for which the field is not defined.</p> |
| [options.sparse] | <code>boolean</code> | <code>false</code> | <p>Don't index documents for which the field is not defined. Use this option along with &quot;unique&quot; if you want to accept multiple documents for which it is not defined.</p> |
| [options.expireAfterSeconds] | <code>number</code> |  | <p>If set, the created index is a TTL (time to live) index, that will automatically remove documents when the system date becomes larger than the date on the indexed field plus <code>expireAfterSeconds</code>. Documents where the indexed field is not specified or not a <code>Date</code> object are ignored</p> |

<a name="Datastore+removeIndex"></a>

### datastore.removeIndex(fieldName, callback)
<p>Remove an index
Previous versions said explicitly the callback was optional, it is now recommended setting one.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Description |
| --- | --- | --- |
| fieldName | <code>string</code> | <p>Field name of the index to remove. Use the dot notation to remove an index referring to a field in a nested document.</p> |
| callback | [<code>NoParamCallback</code>](#NoParamCallback) | <p>Optional callback, signature: err</p> |

<a name="Datastore+removeIndexAsync"></a>

### datastore.removeIndexAsync(fieldName) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Remove an index
Previous versions said explicitly the callback was optional, it is now recommended setting one.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Description |
| --- | --- | --- |
| fieldName | <code>string</code> | <p>Field name of the index to remove. Use the dot notation to remove an index referring to a field in a nested document.</p> |

<a name="Datastore+removeFromIndexes"></a>

### datastore.removeFromIndexes(doc)
<p>Remove one or several document(s) from all indexes</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type |
| --- | --- |
| doc | [<code>document</code>](#document) | 

<a name="Datastore+updateIndexes"></a>

### datastore.updateIndexes(oldDoc, [newDoc])
<p>Update one or several documents in all indexes
To update multiple documents, oldDoc must be an array of { oldDoc, newDoc } pairs
If one update violates a constraint, all changes are rolled back</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Description |
| --- | --- | --- |
| oldDoc | [<code>document</code>](#document) \| <code>Array.&lt;{oldDoc: document, newDoc: document}&gt;</code> | <p>Document to update, or an <code>Array</code> of <code>{oldDoc, newDoc}</code> pairs.</p> |
| [newDoc] | [<code>document</code>](#document) | <p>Document to replace the oldDoc with. If the first argument is an <code>Array</code> of <code>{oldDoc, newDoc}</code> pairs, this second argument is ignored.</p> |

<a name="Datastore+insertAsync"></a>

### datastore.insertAsync(newDoc) ⇒ [<code>Promise.&lt;document&gt;</code>](#document)
<p>Insert a new document
Private Use Datastore.insertAsync which has the same signature</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type |
| --- | --- |
| newDoc | [<code>document</code>](#document) \| [<code>Array.&lt;document&gt;</code>](#document) | 

<a name="Datastore+count"></a>

### datastore.count(query, [callback]) ⇒ <code>Cursor.&lt;number&gt;</code> \| <code>undefined</code>
<p>Count all documents matching the query</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Description |
| --- | --- | --- |
| query | [<code>query</code>](#query) | <p>MongoDB-style query</p> |
| [callback] | [<code>countCallback</code>](#Datastore..countCallback) | <p>If given, the function will return undefined, otherwise it will return the Cursor.</p> |

<a name="Datastore+countAsync"></a>

### datastore.countAsync(query) ⇒ <code>Cursor.&lt;number&gt;</code>
<p>Count all documents matching the query</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Returns**: <code>Cursor.&lt;number&gt;</code> - <p>count</p>  

| Param | Type | Description |
| --- | --- | --- |
| query | [<code>query</code>](#query) | <p>MongoDB-style query</p> |

<a name="Datastore+find"></a>

### datastore.find(query, [projection], [callback]) ⇒ <code>Cursor.&lt;Array.&lt;document&gt;&gt;</code> \| <code>undefined</code>
<p>Find all documents matching the query
If no callback is passed, we return the cursor so that user can limit, skip and finally exec</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | [<code>query</code>](#query) |  | <p>MongoDB-style query</p> |
| [projection] | [<code>projection</code>](#projection) \| [<code>MultipleDocumentsCallback</code>](#MultipleDocumentsCallback) | <code>{}</code> | <p>MongoDB-style projection. If not given, will be interpreted as the callback.</p> |
| [callback] | [<code>MultipleDocumentsCallback</code>](#MultipleDocumentsCallback) |  | <p>Optional callback, signature: err, docs</p> |

<a name="Datastore+findAsync"></a>

### datastore.findAsync(query, [projection]) ⇒ <code>Cursor.&lt;Array.&lt;document&gt;&gt;</code>
<p>Find all documents matching the query
If no callback is passed, we return the cursor so that user can limit, skip and finally exec</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | [<code>query</code>](#query) |  | <p>MongoDB-style query</p> |
| [projection] | [<code>projection</code>](#projection) | <code>{}</code> | <p>MongoDB-style projection</p> |

<a name="Datastore+findOne"></a>

### datastore.findOne(query, projection, callback) ⇒ [<code>Cursor.&lt;document&gt;</code>](#document) \| <code>undefined</code>
<p>Find one document matching the query</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Description |
| --- | --- | --- |
| query | [<code>query</code>](#query) | <p>MongoDB-style query</p> |
| projection | [<code>projection</code>](#projection) | <p>MongoDB-style projection</p> |
| callback | [<code>SingleDocumentCallback</code>](#SingleDocumentCallback) | <p>Optional callback, signature: err, doc</p> |

<a name="Datastore+findOneAsync"></a>

### datastore.findOneAsync(query, projection) ⇒ [<code>Cursor.&lt;document&gt;</code>](#document)
<p>Find one document matching the query</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Description |
| --- | --- | --- |
| query | [<code>query</code>](#query) | <p>MongoDB-style query</p> |
| projection | [<code>projection</code>](#projection) | <p>MongoDB-style projection</p> |

<a name="Datastore+update"></a>

### datastore.update(query, update, [options], [cb])
<p>Update all docs matching query.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | [<code>query</code>](#query) |  | <p>is the same kind of finding query you use with <code>find</code> and <code>findOne</code></p> |
| update | [<code>document</code>](#document) \| <code>update</code> |  | <p>specifies how the documents should be modified. It is either a new document or a set of modifiers (you cannot use both together, it doesn't make sense!):</p> <ul> <li>A new document will replace the matched docs</li> <li>The modifiers create the fields they need to modify if they don't exist, and you can apply them to subdocs. Available field modifiers are <code>$set</code> to change a field's value, <code>$unset</code> to delete a field, <code>$inc</code> to increment a field's value and <code>$min</code>/<code>$max</code> to change field's value, only if provided value is less/greater than current value. To work on arrays, you have <code>$push</code>, <code>$pop</code>, <code>$addToSet</code>, <code>$pull</code>, and the special <code>$each</code> and <code>$slice</code>.</li> </ul> |
| [options] | <code>Object</code> |  | <p>Optional options</p> |
| [options.multi] | <code>boolean</code> | <code>false</code> | <p>If true, can update multiple documents</p> |
| [options.upsert] | <code>boolean</code> | <code>false</code> | <p>If true, can insert a new document corresponding to the <code>update</code> rules if your <code>query</code> doesn't match anything. If your <code>update</code> is a simple object with no modifiers, it is the inserted document. In the other case, the <code>query</code> is stripped from all operator recursively, and the <code>update</code> is applied to it.</p> |
| [options.returnUpdatedDocs] | <code>boolean</code> | <code>false</code> | <p>(not Mongo-DB compatible) If true and update is not an upsert, will return the array of documents matched by the find query and updated. Updated documents will be returned even if the update did not actually modify them.</p> |
| [cb] | [<code>updateCallback</code>](#Datastore..updateCallback) | <code>() &#x3D;&gt; {}</code> | <p>Optional callback</p> |

<a name="Datastore+updateAsync"></a>

### datastore.updateAsync(query, update, [options]) ⇒ <code>Promise.&lt;{numAffected: number, affectedDocuments: (Array.&lt;document&gt;\|document\|null), upsert: boolean}&gt;</code>
<p>Update all docs matching query.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | [<code>query</code>](#query) |  | <p>is the same kind of finding query you use with <code>find</code> and <code>findOne</code></p> |
| update | [<code>document</code>](#document) \| <code>update</code> |  | <p>specifies how the documents should be modified. It is either a new document or a set of modifiers (you cannot use both together, it doesn't make sense!):</p> <ul> <li>A new document will replace the matched docs</li> <li>The modifiers create the fields they need to modify if they don't exist, and you can apply them to subdocs. Available field modifiers are <code>$set</code> to change a field's value, <code>$unset</code> to delete a field, <code>$inc</code> to increment a field's value and <code>$min</code>/<code>$max</code> to change field's value, only if provided value is less/greater than current value. To work on arrays, you have <code>$push</code>, <code>$pop</code>, <code>$addToSet</code>, <code>$pull</code>, and the special <code>$each</code> and <code>$slice</code>.</li> </ul> |
| [options] | <code>Object</code> |  | <p>Optional options</p> |
| [options.multi] | <code>boolean</code> | <code>false</code> | <p>If true, can update multiple documents</p> |
| [options.upsert] | <code>boolean</code> | <code>false</code> | <p>If true, can insert a new document corresponding to the <code>update</code> rules if your <code>query</code> doesn't match anything. If your <code>update</code> is a simple object with no modifiers, it is the inserted document. In the other case, the <code>query</code> is stripped from all operator recursively, and the <code>update</code> is applied to it.</p> |
| [options.returnUpdatedDocs] | <code>boolean</code> | <code>false</code> | <p>(not Mongo-DB compatible) If true and update is not an upsert, will return the array of documents matched by the find query and updated. Updated documents will be returned even if the update did not actually modify them.</p> |

<a name="Datastore+remove"></a>

### datastore.remove(query, [options], [cb])
<p>Remove all docs matching the query.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | [<code>query</code>](#query) |  |  |
| [options] | <code>object</code> |  | <p>Optional options</p> |
| [options.multi] | <code>boolean</code> | <code>false</code> | <p>If true, can update multiple documents</p> |
| [cb] | [<code>removeCallback</code>](#Datastore..removeCallback) | <code>() &#x3D;&gt; {}</code> | <p>Optional callback, signature: err, numRemoved</p> |

<a name="Datastore+removeAsync"></a>

### datastore.removeAsync(query, [options]) ⇒ <code>Promise.&lt;number&gt;</code>
<p>Remove all docs matching the query.
Use Datastore.removeAsync which has the same signature</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Returns**: <code>Promise.&lt;number&gt;</code> - <p>How many documents were removed</p>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | [<code>query</code>](#query) |  |  |
| [options] | <code>object</code> |  | <p>Optional options</p> |
| [options.multi] | <code>boolean</code> | <code>false</code> | <p>If true, can update multiple documents</p> |

<a name="Datastore.event_compaction.done"></a>

### "event:compaction.done"
<p>Compaction event. Happens when the Datastore's Persistence has been compacted.
It happens when calling <code>datastore.persistence.compactDatafile</code>, which is called periodically if you have called
<code>datastore.persistence.setAutocompactionInterval</code>.</p>

**Kind**: event emitted by [<code>Datastore</code>](#Datastore)  
<a name="Datastore..countCallback"></a>

### Datastore~countCallback : <code>function</code>
**Kind**: inner typedef of [<code>Datastore</code>](#Datastore)  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 
| count | <code>number</code> | 

<a name="Datastore..findOneCallback"></a>

### Datastore~findOneCallback : <code>function</code>
**Kind**: inner typedef of [<code>Datastore</code>](#Datastore)  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 
| doc | [<code>document</code>](#document) | 

<a name="Datastore..updateCallback"></a>

### Datastore~updateCallback : <code>function</code>
<p>If update was an upsert, <code>upsert</code> flag is set to true, <code>affectedDocuments</code> can be one of the following:</p>
<ul>
<li>For an upsert, the upserted document</li>
<li>For an update with returnUpdatedDocs option false, null</li>
<li>For an update with returnUpdatedDocs true and multi false, the updated document</li>
<li>For an update with returnUpdatedDocs true and multi true, the array of updated documents</li>
</ul>
<p><strong>WARNING:</strong> The API was changed between v1.7.4 and v1.8, for consistency and readability reasons. Prior and
including to v1.7.4, the callback signature was (err, numAffected, updated) where updated was the updated document
in case of an upsert or the array of updated documents for an update if the returnUpdatedDocs option was true. That
meant that the type of affectedDocuments in a non multi update depended on whether there was an upsert or not,
leaving only two ways for the user to check whether an upsert had occured: checking the type of affectedDocuments
or running another find query on the whole dataset to check its size. Both options being ugly, the breaking change
was necessary.</p>

**Kind**: inner typedef of [<code>Datastore</code>](#Datastore)  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 
| numAffected | <code>number</code> | 
| affectedDocuments | [<code>?Array.&lt;document&gt;</code>](#document) \| [<code>document</code>](#document) | 
| upsert | <code>boolean</code> | 

<a name="Datastore..removeCallback"></a>

### Datastore~removeCallback : <code>function</code>
**Kind**: inner typedef of [<code>Datastore</code>](#Datastore)  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 
| numRemoved | <code>number</code> | 

