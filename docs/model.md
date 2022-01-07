<a name="module_model"></a>

## model
<p>Handle models (i.e. docs)
Serialization/deserialization
Copying
Querying, update</p>


* [model](#module_model)
    * _static_
        * [.checkObject(obj)](#module_model.checkObject)
        * [.serialize(obj)](#module_model.serialize) ⇒ <code>string</code>
        * [.deserialize(rawData)](#module_model.deserialize) ⇒ [<code>document</code>](#document)
        * [.compareThings(a, b, [_compareStrings])](#module_model.compareThings) ⇒ <code>number</code>
        * [.modify(obj, updateQuery)](#module_model.modify) ⇒ [<code>document</code>](#document)
        * [.getDotValue(obj, field)](#module_model.getDotValue) ⇒ <code>\*</code>
        * [.areThingsEqual(a, a)](#module_model.areThingsEqual) ⇒ <code>boolean</code>
        * [.match(obj, query)](#module_model.match) ⇒ <code>boolean</code>
    * _inner_
        * [~modifierFunctions](#module_model..modifierFunctions) : <code>enum</code>
        * [~comparisonFunctions](#module_model..comparisonFunctions) : <code>enum</code>
        * [~logicalOperators](#module_model..logicalOperators)
        * [~modifierFunction](#module_model..modifierFunction) : <code>function</code>
        * [~comparisonOperator](#module_model..comparisonOperator) ⇒ <code>boolean</code>
        * [~whereCallback](#module_model..whereCallback) ⇒ <code>boolean</code>

<a name="module_model.checkObject"></a>

### model.checkObject(obj)
<p>Check a DB object and throw an error if it's not valid
Works by applying the above checkKey function to all fields recursively</p>

**Kind**: static method of [<code>model</code>](#module_model)  
**Params**

- obj [<code>document</code>](#document) | [<code>Array.&lt;document&gt;</code>](#document)

<a name="module_model.serialize"></a>

### model.serialize(obj) ⇒ <code>string</code>
<p>Serialize an object to be persisted to a one-line string
For serialization/deserialization, we use the native JSON parser and not eval or Function
That gives us less freedom but data entered in the database may come from users
so eval and the like are not safe
Accepted primitive types: Number, String, Boolean, Date, null
Accepted secondary types: Objects, Arrays</p>

**Kind**: static method of [<code>model</code>](#module_model)  
**Params**

- obj [<code>document</code>](#document)

<a name="module_model.deserialize"></a>

### model.deserialize(rawData) ⇒ [<code>document</code>](#document)
<p>From a one-line representation of an object generate by the serialize function
Return the object itself</p>

**Kind**: static method of [<code>model</code>](#module_model)  
**Params**

- rawData <code>string</code>

<a name="module_model.compareThings"></a>

### model.compareThings(a, b, [_compareStrings]) ⇒ <code>number</code>
<p>Compare { things U undefined }
Things are defined as any native types (string, number, boolean, null, date) and objects
We need to compare with undefined as it will be used in indexes
In the case of objects and arrays, we deep-compare
If two objects dont have the same type, the (arbitrary) type hierarchy is: undefined, null, number, strings, boolean, dates, arrays, objects
Return -1 if a &lt; b, 1 if a &gt; b and 0 if a = b (note that equality here is NOT the same as defined in areThingsEqual!)</p>

**Kind**: static method of [<code>model</code>](#module_model)  
**Params**

- a <code>\*</code>
- b <code>\*</code>
- [_compareStrings] [<code>compareStrings</code>](#compareStrings) - <p>String comparing function, returning -1, 0 or 1, overriding default string comparison (useful for languages with accented letters)</p>

<a name="module_model.modify"></a>

### model.modify(obj, updateQuery) ⇒ [<code>document</code>](#document)
<p>Modify a DB object according to an update query</p>

**Kind**: static method of [<code>model</code>](#module_model)  
**Params**

- obj [<code>document</code>](#document)
- updateQuery [<code>query</code>](#query)

<a name="module_model.getDotValue"></a>

### model.getDotValue(obj, field) ⇒ <code>\*</code>
<p>Get a value from object with dot notation</p>

**Kind**: static method of [<code>model</code>](#module_model)  
**Params**

- obj <code>object</code>
- field <code>string</code>

<a name="module_model.areThingsEqual"></a>

### model.areThingsEqual(a, a) ⇒ <code>boolean</code>
<p>Check whether 'things' are equal
Things are defined as any native types (string, number, boolean, null, date) and objects
In the case of object, we check deep equality
Returns true if they are, false otherwise</p>

**Kind**: static method of [<code>model</code>](#module_model)  
**Params**

- a <code>\*</code>
- a <code>\*</code>

<a name="module_model.match"></a>

### model.match(obj, query) ⇒ <code>boolean</code>
<p>Tell if a given document matches a query</p>

**Kind**: static method of [<code>model</code>](#module_model)  
**Params**

- obj [<code>document</code>](#document) - <p>Document to check</p>
- query [<code>query</code>](#query)

<a name="module_model..modifierFunctions"></a>

### model~modifierFunctions : <code>enum</code>
**Kind**: inner enum of [<code>model</code>](#module_model)  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| $set | <code>modifierFunction</code> | <code></code> | <p>Set a field to a new value</p> |
| $unset | <code>modifierFunction</code> | <code></code> | <p>Unset a field</p> |
| $min | <code>modifierFunction</code> | <code></code> | <p>Updates the value of the field, only if specified field is smaller than the current value of the field</p> |
| $max | <code>modifierFunction</code> | <code></code> | <p>Updates the value of the field, only if specified field is greater than the current value of the field</p> |
| $inc | <code>modifierFunction</code> | <code></code> | <p>Increment a numeric field's value</p> |
| $pull | <code>modifierFunction</code> | <code></code> | <p>Removes all instances of a value from an existing array</p> |
| $pop | <code>modifierFunction</code> | <code></code> | <p>Remove the first or last element of an array</p> |
| $addToSet | <code>modifierFunction</code> | <code></code> | <p>Add an element to an array field only if it is not already in it No modification if the element is already in the array Note that it doesn't check whether the original array contains duplicates</p> |
| $push | <code>modifierFunction</code> | <code></code> | <p>Push an element to the end of an array field Optional modifier $each instead of value to push several values Optional modifier $slice to slice the resulting array, see https://docs.mongodb.org/manual/reference/operator/update/slice/ Difference with MongoDB: if $slice is specified and not $each, we act as if value is an empty array</p> |

<a name="module_model..comparisonFunctions"></a>

### model~comparisonFunctions : <code>enum</code>
**Kind**: inner enum of [<code>model</code>](#module_model)  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| $lt | <code>comparisonOperator</code> | <code></code> | <p>Lower than</p> |
| $lte | <code>comparisonOperator</code> | <code></code> | <p>Lower than or equals</p> |
| $gt | <code>comparisonOperator</code> | <code></code> | <p>Greater than</p> |
| $gte | <code>comparisonOperator</code> | <code></code> | <p>Greater than or equals</p> |
| $ne | <code>comparisonOperator</code> | <code></code> | <p>Does not equal</p> |
| $in | <code>comparisonOperator</code> | <code></code> | <p>Is in Array</p> |
| $nin | <code>comparisonOperator</code> | <code></code> | <p>Is not in Array</p> |
| $regex | <code>comparisonOperator</code> | <code></code> | <p>Matches Regexp</p> |
| $exists | <code>comparisonOperator</code> | <code></code> | <p>Returns true if field exists</p> |
| $size | <code>comparisonOperator</code> | <code></code> | <p>Specific to Arrays, returns true if a length equals b</p> |
| $elemMatch | <code>comparisonOperator</code> | <code></code> | <p>Specific to Arrays, returns true if some elements of a match the query b</p> |

<a name="module_model..logicalOperators"></a>

### model~logicalOperators
**Kind**: inner enum of [<code>model</code>](#module_model)  
**Properties**

| Name | Default | Description |
| --- | --- | --- |
| $or | <code></code> | <p>Match any of the subqueries</p> |
| $and | <code></code> | <p>Match all of the subqueries</p> |
| $not | <code></code> | <p>Inverted match of the query</p> |
| $where | <code></code> | <p>Use a function to match</p> |

<a name="module_model..modifierFunction"></a>

### model~modifierFunction : <code>function</code>
**Kind**: inner typedef of [<code>model</code>](#module_model)  
**Params**

- obj <code>Object</code> - <p>The model to modify</p>
- field <code>String</code> - <p>Can contain dots, in that case that means we will set a subfield recursively</p>
- value [<code>document</code>](#document)

<a name="module_model..comparisonOperator"></a>

### model~comparisonOperator ⇒ <code>boolean</code>
**Kind**: inner typedef of [<code>model</code>](#module_model)  
**Params**

- a <code>\*</code> - <p>Value in the object</p>
- b <code>\*</code> - <p>Value in the query</p>

<a name="module_model..whereCallback"></a>

### model~whereCallback ⇒ <code>boolean</code>
**Kind**: inner typedef of [<code>model</code>](#module_model)  
**Params**

- obj [<code>document</code>](#document)

