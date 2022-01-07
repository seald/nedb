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
<p>The <code>beforeDeserialization</code>and <code>afterDeserialization</code> callbacks should</p>

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


