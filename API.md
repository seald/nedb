## Classes

<dl>
<dt><a href="#Cursor">Cursor</a> ⇐ <code>Promise</code></dt>
<dd><p>Manage access to data, be it to find, update or remove it.</p>
<p>It extends <code>Promise</code> so that its methods (which return <code>this</code>) are chainable &amp; awaitable.</p></dd>
<dt><a href="#Datastore">Datastore</a> ⇐ <code><a href="http://nodejs.org/api/events.html">EventEmitter</a></code></dt>
<dd><p>The <code>Datastore</code> class is the main class of NeDB.</p></dd>
<dt><a href="#Persistence">Persistence</a></dt>
<dd><p>Under the hood, NeDB's persistence uses an append-only format, meaning that all
updates and deletes actually result in lines added at the end of the datafile,
for performance reasons. The database is automatically compacted (i.e. put back
in the one-line-per-document format) every time you load each database within
your application.</p>
<p>You can manually call the compaction function
with <code>yourDatabase.persistence.compactDatafile</code> which takes no argument. It
queues a compaction of the datafile in the executor, to be executed sequentially
after all pending operations. The datastore will fire a <code>compaction.done</code> event
once compaction is finished.</p>
<p>You can also set automatic compaction at regular intervals
with <code>yourDatabase.persistence.setAutocompactionInterval(interval)</code>, <code>interval</code>
in milliseconds (a minimum of 5s is enforced), and stop automatic compaction
with <code>yourDatabase.persistence.stopAutocompaction()</code>.</p>
<p>Keep in mind that compaction takes a bit of time (not too much: 130ms for 50k
records on a typical development machine) and no other operation can happen when
it does, so most projects actually don't need to use it.</p>
<p>Compaction will also immediately remove any documents whose data line has become
corrupted, assuming that the total percentage of all corrupted documents in that
database still falls below the specified <code>corruptAlertThreshold</code> option's value.</p>
<p>Durability works similarly to major databases: compaction forces the OS to
physically flush data to disk, while appends to the data file do not (the OS is
responsible for flushing the data). That guarantees that a server crash can
never cause complete data loss, while preserving performance. The worst that can
happen is a crash between two syncs, causing a loss of all data between the two
syncs. Usually syncs are 30 seconds appart so that's at most 30 seconds of
data. <a href="http://oldblog.antirez.com/post/redis-persistence-demystified.html">This post by Antirez on Redis persistence</a>
explains this in more details, NeDB being very close to Redis AOF persistence
with <code>appendfsync</code> option set to <code>no</code>.</p></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#NoParamCallback">NoParamCallback</a> : <code>function</code></dt>
<dd><p>Callback with no parameter</p></dd>
<dt><a href="#compareStrings">compareStrings</a> ⇒ <code>number</code></dt>
<dd><p>String comparison function.</p>
<pre class="prettyprint source"><code>  if (a &lt; b) return -1
  if (a > b) return 1
  return 0
</code></pre></dd>
<dt><a href="#MultipleDocumentsCallback">MultipleDocumentsCallback</a> : <code>function</code></dt>
<dd><p>Callback that returns an Array of documents</p></dd>
<dt><a href="#SingleDocumentCallback">SingleDocumentCallback</a> : <code>function</code></dt>
<dd><p>Callback that returns a single document</p></dd>
<dt><a href="#AsyncFunction">AsyncFunction</a> ⇒ <code>Promise.&lt;*&gt;</code></dt>
<dd><p>Generic async function</p></dd>
<dt><a href="#GenericCallback">GenericCallback</a> : <code>function</code></dt>
<dd><p>Callback with generic parameters</p></dd>
<dt><a href="#document">document</a> : <code>Object.&lt;string, *&gt;</code></dt>
<dd><p>Generic document in NeDB.
It consists of an Object with anything you want inside.</p></dd>
<dt><a href="#query">query</a> : <code>Object.&lt;string, *&gt;</code></dt>
<dd><p>Nedb query.</p>
<p>Each key of a query references a field name, which can use the dot-notation to reference subfields inside nested
documents, arrays, arrays of subdocuments and to match a specific element of an array.</p>
<p>Each value of a query can be one of the following:</p>
<ul>
<li><code>string</code>: matches all documents which have this string as value for the referenced field name</li>
<li><code>number</code>: matches all documents which have this number as value for the referenced field name</li>
<li><code>Regexp</code>: matches all documents which have a value that matches the given <code>Regexp</code> for the referenced field name</li>
<li><code>object</code>: matches all documents which have this object as deep-value for the referenced field name</li>
<li>Comparison operators: the syntax is <code>{ field: { $op: value } }</code> where <code>$op</code> is any comparison operator:
<ul>
<li><code>$lt</code>, <code>$lte</code>: less than, less than or equal</li>
<li><code>$gt</code>, <code>$gte</code>: greater than, greater than or equal</li>
<li><code>$in</code>: member of. <code>value</code> must be an array of values</li>
<li><code>$ne</code>, <code>$nin</code>: not equal, not a member of</li>
<li><code>$stat</code>: checks whether the document posses the property <code>field</code>. <code>value</code> should be true or false</li>
<li><code>$regex</code>: checks whether a string is matched by the regular expression. Contrary to MongoDB, the use of
<code>$options</code> with <code>$regex</code> is not supported, because it doesn't give you more power than regex flags. Basic
queries are more readable so only use the <code>$regex</code> operator when you need to use another operator with it</li>
<li><code>$size</code>: if the referenced filed is an Array, matches on the size of the array</li>
<li><code>$elemMatch</code>: matches if at least one array element matches the sub-query entirely</li>
</ul>
</li>
<li>Logical operators: You can combine queries using logical operators:
<ul>
<li>For <code>$or</code> and <code>$and</code>, the syntax is <code>{ $op: [query1, query2, ...] }</code>.</li>
<li>For <code>$not</code>, the syntax is <code>{ $not: query }</code></li>
<li>For <code>$where</code>, the syntax is:</li>
</ul>
<pre class="prettyprint source"><code>{ $where: function () {
  // object is 'this'
  // return a boolean
} }
</code></pre>
</li>
</ul></dd>
<dt><a href="#projection">projection</a> : <code>Object.&lt;string, (0|1)&gt;</code></dt>
<dd><p>Nedb projection.</p>
<p>You can give <code>find</code> and <code>findOne</code> an optional second argument, <code>projections</code>.
The syntax is the same as MongoDB: <code>{ a: 1, b: 1 }</code> to return only the <code>a</code>
and <code>b</code> fields, <code>{ a: 0, b: 0 }</code> to omit these two fields. You cannot use both
modes at the time, except for <code>_id</code> which is by default always returned and
which you can choose to omit. You can project on nested documents.</p>
<p>To reference subfields, you can use the dot-notation.</p></dd>
<dt><a href="#serializationHook">serializationHook</a> ⇒ <code>string</code></dt>
<dd><p>The <code>beforeDeserialization</code> and <code>afterDeserialization</code> callbacks are hooks which are executed respectively before
parsing each document and after stringifying them. They can be used for example to encrypt the Datastore.
The <code>beforeDeserialization</code> should revert what <code>afterDeserialization</code> has done.</p></dd>
<dt><a href="#rawIndex">rawIndex</a></dt>
<dd></dd>
</dl>

<a name="Cursor"></a>

## Cursor ⇐ <code>Promise</code>
<p>Manage access to data, be it to find, update or remove it.</p>
<p>It extends <code>Promise</code> so that its methods (which return <code>this</code>) are chainable &amp; awaitable.</p>

**Kind**: global class  
**Extends**: <code>Promise</code>  

* [Cursor](#Cursor) ⇐ <code>Promise</code>
    * [new Cursor(db, query, [mapFn])](#new_Cursor_new)
    * _instance_
        * [.db](#Cursor+db) : [<code>Datastore</code>](#Datastore)
        * [.query](#Cursor+query) : [<code>query</code>](#query)
        * [.limit(limit)](#Cursor+limit) ⇒ [<code>Cursor</code>](#Cursor)
        * [.skip(skip)](#Cursor+skip) ⇒ [<code>Cursor</code>](#Cursor)
        * [.sort(sortQuery)](#Cursor+sort) ⇒ [<code>Cursor</code>](#Cursor)
        * [.projection(projection)](#Cursor+projection) ⇒ [<code>Cursor</code>](#Cursor)
        * [.exec(_callback)](#Cursor+exec)
        * [.execAsync()](#Cursor+execAsync) ⇒ <code>Promise.&lt;(Array.&lt;document&gt;\|\*)&gt;</code>
    * _inner_
        * [~mapFn](#Cursor..mapFn) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
        * [~execCallback](#Cursor..execCallback) : <code>function</code>

<a name="new_Cursor_new"></a>

### new Cursor(db, query, [mapFn])
<p>Create a new cursor for this collection</p>

**Params**

- db [<code>Datastore</code>](#Datastore) - <p>The datastore this cursor is bound to</p>
- query [<code>query</code>](#query) - <p>The query this cursor will operate on</p>
- [mapFn] [<code>mapFn</code>](#Cursor..mapFn) - <p>Handler to be executed after cursor has found the results and before the callback passed to find/findOne/update/remove</p>

<a name="Cursor+db"></a>

### cursor.db : [<code>Datastore</code>](#Datastore)
**Kind**: instance property of [<code>Cursor</code>](#Cursor)  
**Access**: protected  
<a name="Cursor+query"></a>

### cursor.query : [<code>query</code>](#query)
**Kind**: instance property of [<code>Cursor</code>](#Cursor)  
**Access**: protected  
<a name="Cursor+limit"></a>

### cursor.limit(limit) ⇒ [<code>Cursor</code>](#Cursor)
<p>Set a limit to the number of results</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  
**Params**

- limit <code>Number</code>

<a name="Cursor+skip"></a>

### cursor.skip(skip) ⇒ [<code>Cursor</code>](#Cursor)
<p>Skip a number of results</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  
**Params**

- skip <code>Number</code>

<a name="Cursor+sort"></a>

### cursor.sort(sortQuery) ⇒ [<code>Cursor</code>](#Cursor)
<p>Sort results of the query</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  
**Params**

- sortQuery <code>Object.&lt;string, number&gt;</code> - <p>sortQuery is { field: order }, field can use the dot-notation, order is 1 for ascending and -1 for descending</p>

<a name="Cursor+projection"></a>

### cursor.projection(projection) ⇒ [<code>Cursor</code>](#Cursor)
<p>Add the use of a projection</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  
**Params**

- projection <code>Object.&lt;string, number&gt;</code> - <p>MongoDB-style projection. {} means take all fields. Then it's { key1: 1, key2: 1 } to take only key1 and key2
{ key1: 0, key2: 0 } to omit only key1 and key2. Except _id, you can't mix takes and omits.</p>

<a name="Cursor+exec"></a>

### cursor.exec(_callback)
<p>Get all matching elements
Will return pointers to matched elements (shallow copies), returning full copies is the role of find or findOne</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  
**Params**

- _callback [<code>execCallback</code>](#Cursor..execCallback)

<a name="Cursor+execAsync"></a>

### cursor.execAsync() ⇒ <code>Promise.&lt;(Array.&lt;document&gt;\|\*)&gt;</code>
<p>Async version of [exec](#Cursor+exec).</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  
**See**: Cursor#exec  
<a name="Cursor..mapFn"></a>

### Cursor~mapFn ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
<p>Has a callback</p>

**Kind**: inner typedef of [<code>Cursor</code>](#Cursor)  
**Params**

- res [<code>Array.&lt;document&gt;</code>](#document)

<a name="Cursor..execCallback"></a>

### Cursor~execCallback : <code>function</code>
**Kind**: inner typedef of [<code>Cursor</code>](#Cursor)  
**Params**

- err <code>Error</code>
- res [<code>Array.&lt;document&gt;</code>](#document) | <code>\*</code> - <p>If an mapFn was given to the Cursor, then the type of this parameter is the one returned by the mapFn.</p>

<a name="Datastore"></a>

## Datastore ⇐ [<code>EventEmitter</code>](http://nodejs.org/api/events.html)
<p>The <code>Datastore</code> class is the main class of NeDB.</p>

**Kind**: global class  
**Extends**: [<code>EventEmitter</code>](http://nodejs.org/api/events.html)  
**Emits**: <code>Datastore#event:&quot;compaction.done&quot;</code>  

* [Datastore](#Datastore) ⇐ [<code>EventEmitter</code>](http://nodejs.org/api/events.html)
    * [new Datastore(options)](#new_Datastore_new)
    * _instance_
        * [.inMemoryOnly](#Datastore+inMemoryOnly) : <code>boolean</code>
        * [.autoload](#Datastore+autoload) : <code>boolean</code>
        * [.timestampData](#Datastore+timestampData) : <code>boolean</code>
        * [.filename](#Datastore+filename) : <code>string</code>
        * [.persistence](#Datastore+persistence) : [<code>Persistence</code>](#Persistence)
        * [.executor](#Datastore+executor) : [<code>Executor</code>](#new_Executor_new)
        * [.indexes](#Datastore+indexes) : <code>Object.&lt;string, Index&gt;</code>
        * [.ttlIndexes](#Datastore+ttlIndexes) : <code>Object.&lt;string, number&gt;</code>
        * [.autoloadPromise](#Datastore+autoloadPromise) : <code>Promise</code>
        * [.compareStrings()](#Datastore+compareStrings) : [<code>compareStrings</code>](#compareStrings)
        * [.loadDatabase(callback)](#Datastore+loadDatabase)
        * [.loadDatabaseAsync()](#Datastore+loadDatabaseAsync) ⇒ <code>Promise</code>
        * [.getAllData()](#Datastore+getAllData) ⇒ [<code>Array.&lt;document&gt;</code>](#document)
        * [.ensureIndex(options, callback)](#Datastore+ensureIndex)
        * [.ensureIndexAsync(options)](#Datastore+ensureIndexAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.removeIndex(fieldName, callback)](#Datastore+removeIndex)
        * [.removeIndexAsync(fieldName)](#Datastore+removeIndexAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.insertAsync(newDoc)](#Datastore+insertAsync) ⇒ [<code>Promise.&lt;document&gt;</code>](#document)
        * [.count(query, [callback])](#Datastore+count) ⇒ <code>Cursor.&lt;number&gt;</code> \| <code>undefined</code>
        * [.countAsync(query)](#Datastore+countAsync) ⇒ <code>Cursor.&lt;number&gt;</code>
        * [.find(query, [projection], [callback])](#Datastore+find) ⇒ <code>Cursor.&lt;Array.&lt;document&gt;&gt;</code> \| <code>undefined</code>
        * [.findAsync(query, [projection])](#Datastore+findAsync) ⇒ <code>Cursor.&lt;Array.&lt;document&gt;&gt;</code>
        * [.findOne(query, [projection], [callback])](#Datastore+findOne) ⇒ [<code>Cursor.&lt;document&gt;</code>](#document) \| <code>undefined</code>
        * [.findOneAsync(query, projection)](#Datastore+findOneAsync) ⇒ [<code>Cursor.&lt;document&gt;</code>](#document)
        * [.update(query, update, [options|], [cb])](#Datastore+update)
        * [.updateAsync(query, update, [options])](#Datastore+updateAsync) ⇒ <code>Promise.&lt;{numAffected: number, affectedDocuments: (Array.&lt;document&gt;\|document\|null), upsert: boolean}&gt;</code>
        * [.remove(query, [options], [cb])](#Datastore+remove)
        * [.removeAsync(query, [options])](#Datastore+removeAsync) ⇒ <code>Promise.&lt;number&gt;</code>
        * ["event:compaction.done"](#Datastore+event_compaction.done)
    * _inner_
        * [~countCallback](#Datastore..countCallback) : <code>function</code>
        * [~findOneCallback](#Datastore..findOneCallback) : <code>function</code>
        * [~updateCallback](#Datastore..updateCallback) : <code>function</code>
        * [~removeCallback](#Datastore..removeCallback) : <code>function</code>

<a name="new_Datastore_new"></a>

### new Datastore(options)
<p>Create a new collection, either persistent or in-memory.</p>
<p>If you use a persistent datastore without the <code>autoload</code> option, you need to call [loadDatabase](#Datastore+loadDatabase) or
[loadDatabaseAsync](#Datastore+loadDatabaseAsync) manually. This function fetches the data from datafile and prepares the database.
<strong>Don't forget it!</strong> If you use a persistent datastore, no command (insert, find, update, remove) will be executed
before it is called, so make sure to call it yourself or use the <code>autoload</code> option.</p>
<p>Also, if loading fails, all commands registered to the [executor](#Datastore+executor) afterwards will not be executed.
They will be registered and executed, in sequence, only after a successful loading.</p>

**Params**

- options <code>object</code> | <code>string</code> - <p>Can be an object or a string. If options is a string, the behavior is the same as in
v0.6: it will be interpreted as <code>options.filename</code>. <strong>Giving a string is deprecated, and will be removed in the
next major version.</strong></p>
    - [.filename] <code>string</code> <code> = null</code> - <p>Path to the file where the data is persisted. If left blank, the datastore is
automatically considered in-memory only. It cannot end with a <code>~</code> which is used in the temporary files NeDB uses to
perform crash-safe writes. Not used if <code>options.inMemoryOnly</code> is <code>true</code>.</p>
    - [.inMemoryOnly] <code>boolean</code> <code> = false</code> - <p>If set to true, no data will be written in storage. This option has
priority over <code>options.filename</code>.</p>
    - [.timestampData] <code>boolean</code> <code> = false</code> - <p>If set to true, createdAt and updatedAt will be created and
populated automatically (if not specified by user)</p>
    - [.autoload] <code>boolean</code> <code> = false</code> - <p>If used, the database will automatically be loaded from the datafile
upon creation (you don't need to call <code>loadDatabase</code>). Any command issued before load is finished is buffered and
will be executed when load is done. When autoloading is done, you can either use the <code>onload</code> callback, or you can
use <code>this.autoloadPromise</code> which resolves (or rejects) when autloading is done.</p>
    - [.onload] [<code>NoParamCallback</code>](#NoParamCallback) - <p>If you use autoloading, this is the handler called after the <code>loadDatabase</code>. It
takes one <code>error</code> argument. If you use autoloading without specifying this handler, and an error happens during
load, an error will be thrown.</p>
    - [.beforeDeserialization] [<code>serializationHook</code>](#serializationHook) - <p>Hook you can use to transform data after it was serialized and
before it is written to disk. Can be used for example to encrypt data before writing database to disk. This
function takes a string as parameter (one line of an NeDB data file) and outputs the transformed string, <strong>which
must absolutely not contain a <code>\n</code> character</strong> (or data will be lost).</p>
    - [.afterSerialization] [<code>serializationHook</code>](#serializationHook) - <p>Inverse of <code>afterSerialization</code>. Make sure to include both and not
just one, or you risk data loss. For the same reason, make sure both functions are inverses of one another. Some
failsafe mechanisms are in place to prevent data loss if you misuse the serialization hooks: NeDB checks that never
one is declared without the other, and checks that they are reverse of one another by testing on random strings of
various lengths. In addition, if too much data is detected as corrupt, NeDB will refuse to start as it could mean
you're not using the deserialization hook corresponding to the serialization hook used before.</p>
    - [.corruptAlertThreshold] <code>number</code> <code> = 0.1</code> - <p>Between 0 and 1, defaults to 10%. NeDB will refuse to start
if more than this percentage of the datafile is corrupt. 0 means you don't tolerate any corruption, 1 means you
don't care.</p>
    - [.compareStrings] [<code>compareStrings</code>](#compareStrings) - <p>If specified, it overrides default string comparison which is not
well adapted to non-US characters in particular accented letters. Native <code>localCompare</code> will most of the time be
the right choice.</p>

<a name="Datastore+inMemoryOnly"></a>

### neDB.inMemoryOnly : <code>boolean</code>
<p>Determines if the <code>Datastore</code> keeps data in-memory, or if it saves it in storage. Is not read after
instanciation.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
**Access**: protected  
<a name="Datastore+autoload"></a>

### neDB.autoload : <code>boolean</code>
<p>Determines if the <code>Datastore</code> should autoload the database upon instantiation. Is not read after instanciation.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
**Access**: protected  
<a name="Datastore+timestampData"></a>

### neDB.timestampData : <code>boolean</code>
<p>Determines if the <code>Datastore</code> should add <code>createdAt</code> and <code>updatedAt</code> fields automatically if not set by the user.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
**Access**: protected  
<a name="Datastore+filename"></a>

### neDB.filename : <code>string</code>
<p>If null, it means <code>inMemoryOnly</code> is <code>true</code>. The <code>filename</code> is the name given to the storage module. Is not read
after instanciation.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
**Access**: protected  
<a name="Datastore+persistence"></a>

### neDB.persistence : [<code>Persistence</code>](#Persistence)
<p>The <code>Persistence</code> instance for this <code>Datastore</code>.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
<a name="Datastore+executor"></a>

### neDB.executor : [<code>Executor</code>](#new_Executor_new)
<p>The <code>Executor</code> instance for this <code>Datastore</code>. It is used in all methods exposed by the <code>Datastore</code>, any <code>Cursor</code>
produced by the <code>Datastore</code> and by <code>this.persistence.compactDataFile</code> &amp; <code>this.persistence.compactDataFileAsync</code>
to ensure operations are performed sequentially in the database.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
**Access**: protected  
<a name="Datastore+indexes"></a>

### neDB.indexes : <code>Object.&lt;string, Index&gt;</code>
<p>Indexed by field name, dot notation can be used.
_id is always indexed and since _ids are generated randomly the underlying binary search tree is always well-balanced</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
**Access**: protected  
<a name="Datastore+ttlIndexes"></a>

### neDB.ttlIndexes : <code>Object.&lt;string, number&gt;</code>
<p>Stores the time to live (TTL) of the indexes created. The key represents the field name, the value the number of
seconds after which data with this index field should be removed.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
**Access**: protected  
<a name="Datastore+autoloadPromise"></a>

### neDB.autoloadPromise : <code>Promise</code>
<p>A Promise that resolves when the autoload has finished.</p>
<p>The onload callback is not awaited by this Promise, it is started immediately after that.</p>

**Kind**: instance property of [<code>Datastore</code>](#Datastore)  
<a name="Datastore+compareStrings"></a>

### neDB.compareStrings() : [<code>compareStrings</code>](#compareStrings)
<p>Overrides default string comparison which is not well adapted to non-US characters in particular accented
letters. Native <code>localCompare</code> will most of the time be the right choice</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Access**: protected  
<a name="Datastore+loadDatabase"></a>

### neDB.loadDatabase(callback)
<p>Load the database from the datafile, and trigger the execution of buffered commands if any.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- callback [<code>NoParamCallback</code>](#NoParamCallback)

<a name="Datastore+loadDatabaseAsync"></a>

### neDB.loadDatabaseAsync() ⇒ <code>Promise</code>
<p>Async version of [loadDatabase](#Datastore+loadDatabase).</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**See**: Datastore#loadDatabase  
<a name="Datastore+getAllData"></a>

### neDB.getAllData() ⇒ [<code>Array.&lt;document&gt;</code>](#document)
<p>Get an array of all the data in the database.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
<a name="Datastore+ensureIndex"></a>

### neDB.ensureIndex(options, callback)
<p>Ensure an index is kept for this field. Same parameters as lib/indexes
This function acts synchronously on the indexes, however the persistence of the indexes is deferred with the
executor.
Previous versions said explicitly the callback was optional, it is now recommended setting one.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- options <code>object</code>
    - .fieldName <code>string</code> - <p>Name of the field to index. Use the dot notation to index a field in a nested document.</p>
    - [.unique] <code>boolean</code> <code> = false</code> - <p>Enforce field uniqueness. Note that a unique index will raise an error if you try to index two documents for which the field is not defined.</p>
    - [.sparse] <code>boolean</code> <code> = false</code> - <p>don't index documents for which the field is not defined. Use this option along with &quot;unique&quot; if you want to accept multiple documents for which it is not defined.</p>
    - [.expireAfterSeconds] <code>number</code> - <p>if set, the created index is a TTL (time to live) index, that will automatically remove documents when the system date becomes larger than the date on the indexed field plus <code>expireAfterSeconds</code>. Documents where the indexed field is not specified or not a <code>Date</code> object are ignored</p>
- callback [<code>NoParamCallback</code>](#NoParamCallback) - <p>Callback, signature: err</p>

<a name="Datastore+ensureIndexAsync"></a>

### neDB.ensureIndexAsync(options) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [ensureIndex](#Datastore+ensureIndex).</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**See**: Datastore#ensureIndex  
**Params**

- options <code>object</code>
    - .fieldName <code>string</code> - <p>Name of the field to index. Use the dot notation to index a field in a nested document.</p>
    - [.unique] <code>boolean</code> <code> = false</code> - <p>Enforce field uniqueness. Note that a unique index will raise an error if you try to index two documents for which the field is not defined.</p>
    - [.sparse] <code>boolean</code> <code> = false</code> - <p>Don't index documents for which the field is not defined. Use this option along with &quot;unique&quot; if you want to accept multiple documents for which it is not defined.</p>
    - [.expireAfterSeconds] <code>number</code> - <p>If set, the created index is a TTL (time to live) index, that will automatically remove documents when the system date becomes larger than the date on the indexed field plus <code>expireAfterSeconds</code>. Documents where the indexed field is not specified or not a <code>Date</code> object are ignored</p>

<a name="Datastore+removeIndex"></a>

### neDB.removeIndex(fieldName, callback)
<p>Remove an index
Previous versions said explicitly the callback was optional, it is now recommended setting one.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- fieldName <code>string</code> - <p>Field name of the index to remove. Use the dot notation to remove an index referring to a
field in a nested document.</p>
- callback [<code>NoParamCallback</code>](#NoParamCallback) - <p>Optional callback, signature: err</p>

<a name="Datastore+removeIndexAsync"></a>

### neDB.removeIndexAsync(fieldName) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Async version of [removeIndex](#Datastore+removeIndex).</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**See**: Datastore#removeIndex  
**Params**

- fieldName <code>string</code> - <p>Field name of the index to remove. Use the dot notation to remove an index referring to a
field in a nested document.</p>

<a name="Datastore+insertAsync"></a>

### neDB.insertAsync(newDoc) ⇒ [<code>Promise.&lt;document&gt;</code>](#document)
<p>Async version of [Datastore#insert](Datastore#insert).</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- newDoc [<code>document</code>](#document) | [<code>Array.&lt;document&gt;</code>](#document)

<a name="Datastore+count"></a>

### neDB.count(query, [callback]) ⇒ <code>Cursor.&lt;number&gt;</code> \| <code>undefined</code>
<p>Count all documents matching the query.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- query [<code>query</code>](#query) - <p>MongoDB-style query</p>
- [callback] [<code>countCallback</code>](#Datastore..countCallback) - <p>If given, the function will return undefined, otherwise it will return the Cursor.</p>

<a name="Datastore+countAsync"></a>

### neDB.countAsync(query) ⇒ <code>Cursor.&lt;number&gt;</code>
<p>Async version of [count](#Datastore+count).</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Returns**: <code>Cursor.&lt;number&gt;</code> - <p>count</p>  
**Params**

- query [<code>query</code>](#query) - <p>MongoDB-style query</p>

<a name="Datastore+find"></a>

### neDB.find(query, [projection], [callback]) ⇒ <code>Cursor.&lt;Array.&lt;document&gt;&gt;</code> \| <code>undefined</code>
<p>Find all documents matching the query
If no callback is passed, we return the cursor so that user can limit, skip and finally exec</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- query [<code>query</code>](#query) - <p>MongoDB-style query</p>
- [projection] [<code>projection</code>](#projection) | [<code>MultipleDocumentsCallback</code>](#MultipleDocumentsCallback) <code> = {}</code> - <p>MongoDB-style projection. If not given, will be
interpreted as the callback.</p>
- [callback] [<code>MultipleDocumentsCallback</code>](#MultipleDocumentsCallback) - <p>Optional callback, signature: err, docs</p>

<a name="Datastore+findAsync"></a>

### neDB.findAsync(query, [projection]) ⇒ <code>Cursor.&lt;Array.&lt;document&gt;&gt;</code>
<p>Async version of [find](#Datastore+find).</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- query [<code>query</code>](#query) - <p>MongoDB-style query</p>
- [projection] [<code>projection</code>](#projection) <code> = {}</code> - <p>MongoDB-style projection</p>

<a name="Datastore+findOne"></a>

### neDB.findOne(query, [projection], [callback]) ⇒ [<code>Cursor.&lt;document&gt;</code>](#document) \| <code>undefined</code>
<p>Find one document matching the query.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- query [<code>query</code>](#query) - <p>MongoDB-style query</p>
- [projection] [<code>projection</code>](#projection) | [<code>SingleDocumentCallback</code>](#SingleDocumentCallback) <code> = {}</code> - <p>MongoDB-style projection</p>
- [callback] [<code>SingleDocumentCallback</code>](#SingleDocumentCallback) - <p>Optional callback, signature: err, doc</p>

<a name="Datastore+findOneAsync"></a>

### neDB.findOneAsync(query, projection) ⇒ [<code>Cursor.&lt;document&gt;</code>](#document)
<p>Async version of [findOne](#Datastore+findOne).</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**See**: Datastore#findOne  
**Params**

- query [<code>query</code>](#query) - <p>MongoDB-style query</p>
- projection [<code>projection</code>](#projection) - <p>MongoDB-style projection</p>

<a name="Datastore+update"></a>

### neDB.update(query, update, [options|], [cb])
<p>Update all docs matching query.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- query [<code>query</code>](#query) - <p>is the same kind of finding query you use with <code>find</code> and <code>findOne</code></p>
- update [<code>document</code>](#document) | <code>\*</code> - <p>specifies how the documents should be modified. It is either a new document or a
set of modifiers (you cannot use both together, it doesn't make sense!). Using a new document will replace the
matched docs. Using a set of modifiers will create the fields they need to modify if they don't exist, and you can
apply them to subdocs. Available field modifiers are <code>$set</code> to change a field's value, <code>$unset</code> to delete a field,
<code>$inc</code> to increment a field's value and <code>$min</code>/<code>$max</code> to change field's value, only if provided value is
less/greater than current value. To work on arrays, you have <code>$push</code>, <code>$pop</code>, <code>$addToSet</code>, <code>$pull</code>, and the special
<code>$each</code> and <code>$slice</code>.</p>
- [options|] <code>Object</code> | [<code>updateCallback</code>](#Datastore..updateCallback) - <p>Optional options</p>
    - [.multi] <code>boolean</code> <code> = false</code> - <p>If true, can update multiple documents</p>
    - [.upsert] <code>boolean</code> <code> = false</code> - <p>If true, can insert a new document corresponding to the <code>update</code> rules if
your <code>query</code> doesn't match anything. If your <code>update</code> is a simple object with no modifiers, it is the inserted
document. In the other case, the <code>query</code> is stripped from all operator recursively, and the <code>update</code> is applied to
it.</p>
    - [.returnUpdatedDocs] <code>boolean</code> <code> = false</code> - <p>(not Mongo-DB compatible) If true and update is not an upsert,
will return the array of documents matched by the find query and updated. Updated documents will be returned even
if the update did not actually modify them.</p>
- [cb] [<code>updateCallback</code>](#Datastore..updateCallback) <code> = () &#x3D;&gt; {}</code> - <p>Optional callback</p>

<a name="Datastore+updateAsync"></a>

### neDB.updateAsync(query, update, [options]) ⇒ <code>Promise.&lt;{numAffected: number, affectedDocuments: (Array.&lt;document&gt;\|document\|null), upsert: boolean}&gt;</code>
<p>Async version of [update](#Datastore+update).</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**See**: Datastore#update  
**Params**

- query [<code>query</code>](#query) - <p>is the same kind of finding query you use with <code>find</code> and <code>findOne</code></p>
- update [<code>document</code>](#document) | <code>\*</code> - <p>specifies how the documents should be modified. It is either a new document or a
set of modifiers (you cannot use both together, it doesn't make sense!). Using a new document will replace the
matched docs. Using a set of modifiers will create the fields they need to modify if they don't exist, and you can
apply them to subdocs. Available field modifiers are <code>$set</code> to change a field's value, <code>$unset</code> to delete a field,
<code>$inc</code> to increment a field's value and <code>$min</code>/<code>$max</code> to change field's value, only if provided value is
less/greater than current value. To work on arrays, you have <code>$push</code>, <code>$pop</code>, <code>$addToSet</code>, <code>$pull</code>, and the special
<code>$each</code> and <code>$slice</code>.</p>
- [options] <code>Object</code> <code> = {}</code> - <p>Optional options</p>
    - [.multi] <code>boolean</code> <code> = false</code> - <p>If true, can update multiple documents</p>
    - [.upsert] <code>boolean</code> <code> = false</code> - <p>If true, can insert a new document corresponding to the <code>update</code> rules if
your <code>query</code> doesn't match anything. If your <code>update</code> is a simple object with no modifiers, it is the inserted
document. In the other case, the <code>query</code> is stripped from all operator recursively, and the <code>update</code> is applied to
it.</p>
    - [.returnUpdatedDocs] <code>boolean</code> <code> = false</code> - <p>(not Mongo-DB compatible) If true and update is not an upsert,
will return the array of documents matched by the find query and updated. Updated documents will be returned even
if the update did not actually modify them.</p>

<a name="Datastore+remove"></a>

### neDB.remove(query, [options], [cb])
<p>Remove all docs matching the query.</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Params**

- query [<code>query</code>](#query)
- [options] <code>object</code> | [<code>removeCallback</code>](#Datastore..removeCallback) <code> = {}</code> - <p>Optional options</p>
    - [.multi] <code>boolean</code> <code> = false</code> - <p>If true, can update multiple documents</p>
- [cb] [<code>removeCallback</code>](#Datastore..removeCallback) <code> = () &#x3D;&gt; {}</code> - <p>Optional callback</p>

<a name="Datastore+removeAsync"></a>

### neDB.removeAsync(query, [options]) ⇒ <code>Promise.&lt;number&gt;</code>
<p>Remove all docs matching the query.
Use Datastore.removeAsync which has the same signature</p>

**Kind**: instance method of [<code>Datastore</code>](#Datastore)  
**Returns**: <code>Promise.&lt;number&gt;</code> - <p>How many documents were removed</p>  
**Params**

- query [<code>query</code>](#query)
- [options] <code>object</code> <code> = {}</code> - <p>Optional options</p>
    - [.multi] <code>boolean</code> <code> = false</code> - <p>If true, can update multiple documents</p>

<a name="Datastore+event_compaction.done"></a>

### "event:compaction.done"
<p>Compaction event. Happens when the Datastore's Persistence has been compacted.
It happens when calling <code>datastore.persistence.compactDatafile</code>, which is called periodically if you have called
<code>datastore.persistence.setAutocompactionInterval</code>.</p>

**Kind**: event emitted by [<code>Datastore</code>](#Datastore)  
<a name="Datastore..countCallback"></a>

### Datastore~countCallback : <code>function</code>
**Kind**: inner typedef of [<code>Datastore</code>](#Datastore)  
**Params**

- err <code>Error</code>
- count <code>number</code>

<a name="Datastore..findOneCallback"></a>

### Datastore~findOneCallback : <code>function</code>
**Kind**: inner typedef of [<code>Datastore</code>](#Datastore)  
**Params**

- err <code>Error</code>
- doc [<code>document</code>](#document)

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
**Params**

- err <code>Error</code>
- numAffected <code>number</code>
- affectedDocuments [<code>?Array.&lt;document&gt;</code>](#document) | [<code>document</code>](#document)
- upsert <code>boolean</code>

<a name="Datastore..removeCallback"></a>

### Datastore~removeCallback : <code>function</code>
**Kind**: inner typedef of [<code>Datastore</code>](#Datastore)  
**Params**

- err <code>Error</code>
- numRemoved <code>number</code>

<a name="Persistence"></a>

## Persistence
<p>Under the hood, NeDB's persistence uses an append-only format, meaning that all
updates and deletes actually result in lines added at the end of the datafile,
for performance reasons. The database is automatically compacted (i.e. put back
in the one-line-per-document format) every time you load each database within
your application.</p>
<p>You can manually call the compaction function
with <code>yourDatabase.persistence.compactDatafile</code> which takes no argument. It
queues a compaction of the datafile in the executor, to be executed sequentially
after all pending operations. The datastore will fire a <code>compaction.done</code> event
once compaction is finished.</p>
<p>You can also set automatic compaction at regular intervals
with <code>yourDatabase.persistence.setAutocompactionInterval(interval)</code>, <code>interval</code>
in milliseconds (a minimum of 5s is enforced), and stop automatic compaction
with <code>yourDatabase.persistence.stopAutocompaction()</code>.</p>
<p>Keep in mind that compaction takes a bit of time (not too much: 130ms for 50k
records on a typical development machine) and no other operation can happen when
it does, so most projects actually don't need to use it.</p>
<p>Compaction will also immediately remove any documents whose data line has become
corrupted, assuming that the total percentage of all corrupted documents in that
database still falls below the specified <code>corruptAlertThreshold</code> option's value.</p>
<p>Durability works similarly to major databases: compaction forces the OS to
physically flush data to disk, while appends to the data file do not (the OS is
responsible for flushing the data). That guarantees that a server crash can
never cause complete data loss, while preserving performance. The worst that can
happen is a crash between two syncs, causing a loss of all data between the two
syncs. Usually syncs are 30 seconds appart so that's at most 30 seconds of
data. <a href="http://oldblog.antirez.com/post/redis-persistence-demystified.html">This post by Antirez on Redis persistence</a>
explains this in more details, NeDB being very close to Redis AOF persistence
with <code>appendfsync</code> option set to <code>no</code>.</p>

**Kind**: global class  

* [Persistence](#Persistence)
    * [new Persistence()](#new_Persistence_new)
    * _instance_
        * [.persistCachedDatabaseAsync()](#Persistence+persistCachedDatabaseAsync) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.compactDatafile([callback])](#Persistence+compactDatafile)
        * [.compactDatafileAsync()](#Persistence+compactDatafileAsync)
        * [.setAutocompactionInterval(interval)](#Persistence+setAutocompactionInterval)
        * [.stopAutocompaction()](#Persistence+stopAutocompaction)
        * [.persistNewStateAsync(newDocs)](#Persistence+persistNewStateAsync) ⇒ <code>Promise</code>
        * [.treatRawData(rawData)](#Persistence+treatRawData) ⇒ <code>Object</code>
        * [.treatRawStreamAsync(rawStream)](#Persistence+treatRawStreamAsync) ⇒ <code>Promise.&lt;{data: Array.&lt;document&gt;, indexes: Object.&lt;string, rawIndex&gt;}&gt;</code>
        * [.loadDatabase(callback)](#Persistence+loadDatabase)
        * [.loadDatabaseAsync()](#Persistence+loadDatabaseAsync) ⇒ <code>Promise.&lt;void&gt;</code>
    * _static_
        * [.ensureDirectoryExistsAsync(dir)](#Persistence.ensureDirectoryExistsAsync) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_Persistence_new"></a>

### new Persistence()
<p>Create a new Persistence object for database options.db</p>

**Params**

    - .db [<code>Datastore</code>](#Datastore)
    - [.corruptAlertThreshold] <code>Number</code> - <p>Optional, threshold after which an alert is thrown if too much data is corrupt</p>
    - [.beforeDeserialization] [<code>serializationHook</code>](#serializationHook) - <p>Hook you can use to transform data after it was serialized and before it is written to disk.</p>
    - [.afterSerialization] [<code>serializationHook</code>](#serializationHook) - <p>Inverse of <code>afterSerialization</code>.</p>

<a name="Persistence+persistCachedDatabaseAsync"></a>

### persistence.persistCachedDatabaseAsync() ⇒ <code>Promise.&lt;void&gt;</code>
<p>Persist cached database
This serves as a compaction function since the cache always contains only the number of documents in the collection
while the data file is append-only so it may grow larger</p>
<p>This is an internal function, use [compactDatafileAsync](#Persistence+compactDatafileAsync) which uses the [executor](#Datastore+executor).</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Access**: protected  
<a name="Persistence+compactDatafile"></a>

### persistence.compactDatafile([callback])
<p>Queue a rewrite of the datafile</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**See**: Persistence#persistCachedDatabaseAsync  
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
<a name="Persistence+persistNewStateAsync"></a>

### persistence.persistNewStateAsync(newDocs) ⇒ <code>Promise</code>
<p>Persist new state for the given newDocs (can be insertion, update or removal)
Use an append-only format</p>
<p>Do not use directly, it should only used by a [Datastore](#Datastore) instance.</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
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

<a name="Persistence+treatRawStreamAsync"></a>

### persistence.treatRawStreamAsync(rawStream) ⇒ <code>Promise.&lt;{data: Array.&lt;document&gt;, indexes: Object.&lt;string, rawIndex&gt;}&gt;</code>
<p>From a database's raw data stream, return the corresponding machine understandable collection
Is only used by a [Datastore](#Datastore) instance.</p>
<p>Is only used in the Node.js version, since [React-Native](module:storageReactNative) &amp;
[browser](module:storageBrowser) storage modules don't provide an equivalent of
[readFileStream](#module_storage.readFileStream).</p>
<p>Do not use directly, it should only used by a [Datastore](#Datastore) instance.</p>

**Kind**: instance method of [<code>Persistence</code>](#Persistence)  
**Access**: protected  
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
<a name="Persistence.ensureDirectoryExistsAsync"></a>

### Persistence.ensureDirectoryExistsAsync(dir) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Check if a directory stat and create it on the fly if it is not the case.</p>

**Kind**: static method of [<code>Persistence</code>](#Persistence)  
**Params**

- dir <code>string</code>

<a name="NoParamCallback"></a>

## NoParamCallback : <code>function</code>
<p>Callback with no parameter</p>

**Kind**: global typedef  
**Params**

- err <code>Error</code>

<a name="compareStrings"></a>

## compareStrings ⇒ <code>number</code>
<p>String comparison function.</p>
<pre class="prettyprint source"><code>  if (a &lt; b) return -1
  if (a > b) return 1
  return 0
</code></pre>

**Kind**: global typedef  
**Params**

- a <code>string</code>
- b <code>string</code>

<a name="MultipleDocumentsCallback"></a>

## MultipleDocumentsCallback : <code>function</code>
<p>Callback that returns an Array of documents</p>

**Kind**: global typedef  
**Params**

- err <code>Error</code>
- docs [<code>Array.&lt;document&gt;</code>](#document)

<a name="SingleDocumentCallback"></a>

## SingleDocumentCallback : <code>function</code>
<p>Callback that returns a single document</p>

**Kind**: global typedef  
**Params**

- err <code>Error</code>
- docs [<code>document</code>](#document)

<a name="AsyncFunction"></a>

## AsyncFunction ⇒ <code>Promise.&lt;\*&gt;</code>
<p>Generic async function</p>

**Kind**: global typedef  
**Params**

- ...args <code>\*</code>

<a name="GenericCallback"></a>

## GenericCallback : <code>function</code>
<p>Callback with generic parameters</p>

**Kind**: global typedef  
**Params**

- err <code>Error</code>
- ...args <code>\*</code>

<a name="document"></a>

## document : <code>Object.&lt;string, \*&gt;</code>
<p>Generic document in NeDB.
It consists of an Object with anything you want inside.</p>

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [_id] | <code>string</code> | <p>Internal <code>_id</code> of the document, which can be <code>null</code> or undefined at some points (when not inserted yet for example).</p> |

<a name="query"></a>

## query : <code>Object.&lt;string, \*&gt;</code>
<p>Nedb query.</p>
<p>Each key of a query references a field name, which can use the dot-notation to reference subfields inside nested
documents, arrays, arrays of subdocuments and to match a specific element of an array.</p>
<p>Each value of a query can be one of the following:</p>
<ul>
<li><code>string</code>: matches all documents which have this string as value for the referenced field name</li>
<li><code>number</code>: matches all documents which have this number as value for the referenced field name</li>
<li><code>Regexp</code>: matches all documents which have a value that matches the given <code>Regexp</code> for the referenced field name</li>
<li><code>object</code>: matches all documents which have this object as deep-value for the referenced field name</li>
<li>Comparison operators: the syntax is <code>{ field: { $op: value } }</code> where <code>$op</code> is any comparison operator:
<ul>
<li><code>$lt</code>, <code>$lte</code>: less than, less than or equal</li>
<li><code>$gt</code>, <code>$gte</code>: greater than, greater than or equal</li>
<li><code>$in</code>: member of. <code>value</code> must be an array of values</li>
<li><code>$ne</code>, <code>$nin</code>: not equal, not a member of</li>
<li><code>$stat</code>: checks whether the document posses the property <code>field</code>. <code>value</code> should be true or false</li>
<li><code>$regex</code>: checks whether a string is matched by the regular expression. Contrary to MongoDB, the use of
<code>$options</code> with <code>$regex</code> is not supported, because it doesn't give you more power than regex flags. Basic
queries are more readable so only use the <code>$regex</code> operator when you need to use another operator with it</li>
<li><code>$size</code>: if the referenced filed is an Array, matches on the size of the array</li>
<li><code>$elemMatch</code>: matches if at least one array element matches the sub-query entirely</li>
</ul>
</li>
<li>Logical operators: You can combine queries using logical operators:
<ul>
<li>For <code>$or</code> and <code>$and</code>, the syntax is <code>{ $op: [query1, query2, ...] }</code>.</li>
<li>For <code>$not</code>, the syntax is <code>{ $not: query }</code></li>
<li>For <code>$where</code>, the syntax is:</li>
</ul>
<pre class="prettyprint source"><code>{ $where: function () {
  // object is 'this'
  // return a boolean
} }
</code></pre>
</li>
</ul>

**Kind**: global typedef  
<a name="projection"></a>

## projection : <code>Object.&lt;string, (0\|1)&gt;</code>
<p>Nedb projection.</p>
<p>You can give <code>find</code> and <code>findOne</code> an optional second argument, <code>projections</code>.
The syntax is the same as MongoDB: <code>{ a: 1, b: 1 }</code> to return only the <code>a</code>
and <code>b</code> fields, <code>{ a: 0, b: 0 }</code> to omit these two fields. You cannot use both
modes at the time, except for <code>_id</code> which is by default always returned and
which you can choose to omit. You can project on nested documents.</p>
<p>To reference subfields, you can use the dot-notation.</p>

**Kind**: global typedef  
<a name="serializationHook"></a>

## serializationHook ⇒ <code>string</code>
<p>The <code>beforeDeserialization</code> and <code>afterDeserialization</code> callbacks are hooks which are executed respectively before
parsing each document and after stringifying them. They can be used for example to encrypt the Datastore.
The <code>beforeDeserialization</code> should revert what <code>afterDeserialization</code> has done.</p>

**Kind**: global typedef  
**Params**

- x <code>string</code>

<a name="rawIndex"></a>

## rawIndex
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| fieldName | <code>string</code> | 
| [unique] | <code>boolean</code> | 
| [sparse] | <code>boolean</code> | 

