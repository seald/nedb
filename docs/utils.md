<a name="module_utils"></a>

## utils
<p>Utility functions for all environments.
This replaces the underscore dependency.</p>


* [utils](#module_utils)
    * _static_
        * [.uniq(array, [iteratee])](#module_utils.uniq) ⇒ <code>Array</code>
        * [.isDate(d)](#module_utils.isDate) ⇒ <code>boolean</code>
        * [.isRegExp(re)](#module_utils.isRegExp) ⇒ <code>boolean</code>
    * _inner_
        * [~isObject(arg)](#module_utils..isObject) ⇒ <code>boolean</code>

<a name="module_utils.uniq"></a>

### utils.uniq(array, [iteratee]) ⇒ <code>Array</code>
<p>Produces a duplicate-free version of the array, using === to test object equality. In particular only the first
occurrence of each value is kept. If you want to compute unique items based on a transformation, pass an iteratee
function.</p>
<p>Heavily inspired by [https://underscorejs.org/#uniq](https://underscorejs.org/#uniq).</p>

**Kind**: static method of [<code>utils</code>](#module_utils)  
**Params**

- array <code>Array</code>
- [iteratee] <code>function</code> - <p>transformation applied to every element before checking for duplicates. This will not
transform the items in the result.</p>

<a name="module_utils.isDate"></a>

### utils.isDate(d) ⇒ <code>boolean</code>
<p>Returns true if d is a Date.</p>
<p>Heavily inspired by [https://underscorejs.org/#isDate](https://underscorejs.org/#isDate).</p>

**Kind**: static method of [<code>utils</code>](#module_utils)  
**Params**

- d <code>\*</code>

<a name="module_utils.isRegExp"></a>

### utils.isRegExp(re) ⇒ <code>boolean</code>
<p>Returns true if re is a RegExp.</p>
<p>Heavily inspired by [https://underscorejs.org/#isRegExp](https://underscorejs.org/#isRegExp).</p>

**Kind**: static method of [<code>utils</code>](#module_utils)  
**Params**

- re <code>\*</code>

<a name="module_utils..isObject"></a>

### utils~isObject(arg) ⇒ <code>boolean</code>
<p>Returns true if arg is an Object. Note that JavaScript arrays and functions are objects, while (normal) strings
and numbers are not.</p>
<p>Heavily inspired by [https://underscorejs.org/#isObject](https://underscorejs.org/#isObject).</p>

**Kind**: inner method of [<code>utils</code>](#module_utils)  
**Params**

- arg <code>\*</code>

