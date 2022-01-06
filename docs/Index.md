<a name="Index"></a>

## Index
<p>Indexes on field names, with atomic operations and which can optionally enforce a unique constraint or allow indexed
fields to be undefined</p>

**Kind**: global class  

* [Index](#Index)
    * [new Index(options)](#new_Index_new)
    * [.fieldName](#Index+fieldName) : <code>string</code>
    * [.unique](#Index+unique) : <code>boolean</code>
    * [.sparse](#Index+sparse) : <code>boolean</code>
    * [.treeOptions](#Index+treeOptions) : <code>Object</code>
    * [.tree](#Index+tree) : <code>AVLTree</code>
    * [.reset([newData])](#Index+reset)
    * [.insert(doc)](#Index+insert)
    * [.remove(doc)](#Index+remove)
    * [.update(oldDoc, [newDoc])](#Index+update)
    * [.revertUpdate(oldDoc, [newDoc])](#Index+revertUpdate)
    * [.getMatching(value)](#Index+getMatching) ⇒ [<code>Array.&lt;document&gt;</code>](#document)
    * [.getBetweenBounds(query)](#Index+getBetweenBounds) ⇒ [<code>Array.&lt;document&gt;</code>](#document)
    * [.getAll()](#Index+getAll) ⇒ [<code>Array.&lt;document&gt;</code>](#document)

<a name="new_Index_new"></a>

### new Index(options)
<p>Create a new index
All methods on an index guarantee that either the whole operation was successful and the index changed
or the operation was unsuccessful and an error is thrown while the index is unchanged</p>


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  |  |
| options.fieldName | <code>string</code> |  | <p>On which field should the index apply (can use dot notation to index on sub fields)</p> |
| [options.unique] | <code>boolean</code> | <code>false</code> | <p>Enforces a unique constraint</p> |
| [options.sparse] | <code>boolean</code> | <code>false</code> | <p>Allows a sparse index (we can have documents for which fieldName is <code>undefined</code>)</p> |

<a name="Index+fieldName"></a>

### index.fieldName : <code>string</code>
<p>On which field the index applies to (may use dot notation to index on sub fields).</p>

**Kind**: instance property of [<code>Index</code>](#Index)  
<a name="Index+unique"></a>

### index.unique : <code>boolean</code>
<p>Defines if the index enforces a unique constraint for this index.</p>

**Kind**: instance property of [<code>Index</code>](#Index)  
<a name="Index+sparse"></a>

### index.sparse : <code>boolean</code>
<p>Defines if we can have documents for which fieldName is <code>undefined</code></p>

**Kind**: instance property of [<code>Index</code>](#Index)  
<a name="Index+treeOptions"></a>

### index.treeOptions : <code>Object</code>
<p>Options object given to the underlying BinarySearchTree.</p>

**Kind**: instance property of [<code>Index</code>](#Index)  
<a name="Index+tree"></a>

### index.tree : <code>AVLTree</code>
<p>Underlying BinarySearchTree for this index. Uses an AVLTree for optimization.</p>

**Kind**: instance property of [<code>Index</code>](#Index)  
<a name="Index+reset"></a>

### index.reset([newData])
<p>Reset an index</p>

**Kind**: instance method of [<code>Index</code>](#Index)  

| Param | Type | Description |
| --- | --- | --- |
| [newData] | [<code>document</code>](#document) \| [<code>?Array.&lt;document&gt;</code>](#document) | <p>Data to initialize the index with. If an error is thrown during insertion, the index is not modified.</p> |

<a name="Index+insert"></a>

### index.insert(doc)
<p>Insert a new document in the index
If an array is passed, we insert all its elements (if one insertion fails the index is not modified)
O(log(n))</p>

**Kind**: instance method of [<code>Index</code>](#Index)  

| Param | Type | Description |
| --- | --- | --- |
| doc | [<code>document</code>](#document) \| [<code>Array.&lt;document&gt;</code>](#document) | <p>The document, or array of documents, to insert.</p> |

<a name="Index+remove"></a>

### index.remove(doc)
<p>Removes a document from the index.
If an array is passed, we remove all its elements
The remove operation is safe with regards to the 'unique' constraint
O(log(n))</p>

**Kind**: instance method of [<code>Index</code>](#Index)  

| Param | Type | Description |
| --- | --- | --- |
| doc | [<code>Array.&lt;document&gt;</code>](#document) \| [<code>document</code>](#document) | <p>The document, or Array of documents, to remove.</p> |

<a name="Index+update"></a>

### index.update(oldDoc, [newDoc])
<p>Update a document in the index
If a constraint is violated, changes are rolled back and an error thrown
Naive implementation, still in O(log(n))</p>

**Kind**: instance method of [<code>Index</code>](#Index)  

| Param | Type | Description |
| --- | --- | --- |
| oldDoc | [<code>document</code>](#document) \| <code>Array.&lt;{oldDoc: document, newDoc: document}&gt;</code> | <p>Document to update, or an <code>Array</code> of <code>{oldDoc, newDoc}</code> pairs.</p> |
| [newDoc] | [<code>document</code>](#document) | <p>Document to replace the oldDoc with. If the first argument is an <code>Array</code> of <code>{oldDoc, newDoc}</code> pairs, this second argument is ignored.</p> |

<a name="Index+revertUpdate"></a>

### index.revertUpdate(oldDoc, [newDoc])
<p>Revert an update</p>

**Kind**: instance method of [<code>Index</code>](#Index)  

| Param | Type | Description |
| --- | --- | --- |
| oldDoc | [<code>document</code>](#document) \| <code>Array.&lt;{oldDoc: document, newDoc: document}&gt;</code> | <p>Document to revert to, or an <code>Array</code> of <code>{oldDoc, newDoc}</code> pairs.</p> |
| [newDoc] | [<code>document</code>](#document) | <p>Document to revert from. If the first argument is an Array of {oldDoc, newDoc}, this second argument is ignored.</p> |

<a name="Index+getMatching"></a>

### index.getMatching(value) ⇒ [<code>Array.&lt;document&gt;</code>](#document)
<p>Get all documents in index whose key match value (if it is a Thing) or one of the elements of value (if it is an array of Things)</p>

**Kind**: instance method of [<code>Index</code>](#Index)  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>Array.&lt;\*&gt;</code> \| <code>\*</code> | <p>Value to match the key against</p> |

<a name="Index+getBetweenBounds"></a>

### index.getBetweenBounds(query) ⇒ [<code>Array.&lt;document&gt;</code>](#document)
<p>Get all documents in index whose key is between bounds are they are defined by query
Documents are sorted by key</p>

**Kind**: instance method of [<code>Index</code>](#Index)  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>object</code> | <p>An object with at least one matcher among $gt, $gte, $lt, $lte.</p> |
| [query.$gt] | <code>\*</code> | <p>Greater than matcher.</p> |
| [query.$gte] | <code>\*</code> | <p>Greater than or equal matcher.</p> |
| [query.$lt] | <code>\*</code> | <p>Lower than matcher.</p> |
| [query.$lte] | <code>\*</code> | <p>Lower than or equal matcher.</p> |

<a name="Index+getAll"></a>

### index.getAll() ⇒ [<code>Array.&lt;document&gt;</code>](#document)
<p>Get all elements in the index</p>

**Kind**: instance method of [<code>Index</code>](#Index)  
