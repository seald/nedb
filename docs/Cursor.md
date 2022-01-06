<a name="Cursor"></a>

## Cursor ⇐ <code>Promise</code>
<p>Manage access to data, be it to find, update or remove it.</p>
<p>It extends Promise so that its methods are chainable &amp; awaitable.</p>

**Kind**: global class  
**Extends**: <code>Promise</code>  

* [Cursor](#Cursor) ⇐ <code>Promise</code>
    * [new Cursor(db, query, [execFn], [async])](#new_Cursor_new)
    * _instance_
        * [.limit(limit)](#Cursor+limit) ⇒ [<code>Cursor</code>](#Cursor)
        * [.skip(skip)](#Cursor+skip) ⇒ [<code>Cursor</code>](#Cursor)
        * [.sort(sortQuery)](#Cursor+sort) ⇒ [<code>Cursor</code>](#Cursor)
        * [.projection(projection)](#Cursor+projection) ⇒ [<code>Cursor</code>](#Cursor)
        * [.project(candidates)](#Cursor+project) ⇒ [<code>Array.&lt;document&gt;</code>](#document)
        * [._execAsync()](#Cursor+_execAsync) ⇒ [<code>Array.&lt;document&gt;</code>](#document) \| <code>Promise.&lt;\*&gt;</code>
        * [._exec(_callback)](#Cursor+_exec)
        * [.exec(_callback)](#Cursor+exec)
        * [.execAsync()](#Cursor+execAsync) ⇒ <code>Promise.&lt;(Array.&lt;document&gt;\|\*)&gt;</code>
    * _inner_
        * [~execFn](#Cursor..execFn) : <code>function</code>
        * [~execFnAsync](#Cursor..execFnAsync) ⇒ <code>Promise</code>
        * [~execCallback](#Cursor..execCallback) : <code>function</code>

<a name="new_Cursor_new"></a>

### new Cursor(db, query, [execFn], [async])
<p>Create a new cursor for this collection</p>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| db | [<code>Datastore</code>](#Datastore) |  | <p>The datastore this cursor is bound to</p> |
| query | [<code>query</code>](#query) |  | <p>The query this cursor will operate on</p> |
| [execFn] | [<code>execFn</code>](#Cursor..execFn) \| [<code>execFnAsync</code>](#Cursor..execFnAsync) |  | <p>Handler to be executed after cursor has found the results and before the callback passed to find/findOne/update/remove</p> |
| [async] | <code>boolean</code> | <code>false</code> | <p>If true, specifies that the <code>execFn</code> is of type [execFnAsync](#Cursor..execFnAsync) rather than [execFn](#Cursor..execFn).</p> |

<a name="Cursor+limit"></a>

### cursor.limit(limit) ⇒ [<code>Cursor</code>](#Cursor)
<p>Set a limit to the number of results</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  

| Param | Type |
| --- | --- |
| limit | <code>Number</code> | 

<a name="Cursor+skip"></a>

### cursor.skip(skip) ⇒ [<code>Cursor</code>](#Cursor)
<p>Skip a number of results</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  

| Param | Type |
| --- | --- |
| skip | <code>Number</code> | 

<a name="Cursor+sort"></a>

### cursor.sort(sortQuery) ⇒ [<code>Cursor</code>](#Cursor)
<p>Sort results of the query</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  

| Param | Type | Description |
| --- | --- | --- |
| sortQuery | <code>Object.&lt;string, number&gt;</code> | <p>sortQuery is { field: order }, field can use the dot-notation, order is 1 for ascending and -1 for descending</p> |

<a name="Cursor+projection"></a>

### cursor.projection(projection) ⇒ [<code>Cursor</code>](#Cursor)
<p>Add the use of a projection</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  

| Param | Type | Description |
| --- | --- | --- |
| projection | <code>Object.&lt;string, number&gt;</code> | <p>MongoDB-style projection. {} means take all fields. Then it's { key1: 1, key2: 1 } to take only key1 and key2 { key1: 0, key2: 0 } to omit only key1 and key2. Except _id, you can't mix takes and omits.</p> |

<a name="Cursor+project"></a>

### cursor.project(candidates) ⇒ [<code>Array.&lt;document&gt;</code>](#document)
<p>Apply the projection</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  

| Param | Type |
| --- | --- |
| candidates | [<code>Array.&lt;document&gt;</code>](#document) | 

<a name="Cursor+_execAsync"></a>

### cursor.\_execAsync() ⇒ [<code>Array.&lt;document&gt;</code>](#document) \| <code>Promise.&lt;\*&gt;</code>
<p>Get all matching elements
Will return pointers to matched elements (shallow copies), returning full copies is the role of find or findOne
This is an internal function, use execAsync which uses the executor</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  
<a name="Cursor+_exec"></a>

### cursor.\_exec(_callback)
<p>Get all matching elements
Will return pointers to matched elements (shallow copies), returning full copies is the role of find or findOne
This is an internal function, use exec which uses the executor</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  

| Param | Type |
| --- | --- |
| _callback | [<code>execCallback</code>](#Cursor..execCallback) | 

<a name="Cursor+exec"></a>

### cursor.exec(_callback)
<p>Get all matching elements
Will return pointers to matched elements (shallow copies), returning full copies is the role of find or findOne</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  

| Param | Type |
| --- | --- |
| _callback | [<code>execCallback</code>](#Cursor..execCallback) | 

<a name="Cursor+execAsync"></a>

### cursor.execAsync() ⇒ <code>Promise.&lt;(Array.&lt;document&gt;\|\*)&gt;</code>
<p>Get all matching elements
Will return pointers to matched elements (shallow copies), returning full copies is the role of find or findOne</p>

**Kind**: instance method of [<code>Cursor</code>](#Cursor)  
<a name="Cursor..execFn"></a>

### Cursor~execFn : <code>function</code>
**Kind**: inner typedef of [<code>Cursor</code>](#Cursor)  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 
| res | [<code>?Array.&lt;document&gt;</code>](#document) \| [<code>document</code>](#document) | 

<a name="Cursor..execFnAsync"></a>

### Cursor~execFnAsync ⇒ <code>Promise</code>
**Kind**: inner typedef of [<code>Cursor</code>](#Cursor)  

| Param | Type |
| --- | --- |
| res | [<code>?Array.&lt;document&gt;</code>](#document) \| [<code>document</code>](#document) | 

<a name="Cursor..execCallback"></a>

### Cursor~execCallback : <code>function</code>
**Kind**: inner typedef of [<code>Cursor</code>](#Cursor)  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> |  |
| res | [<code>Array.&lt;document&gt;</code>](#document) \| <code>\*</code> | <p>If an execFn was given to the Cursor, then the type of this parameter is the one returned by the execFn.</p> |

