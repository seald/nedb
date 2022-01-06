<a name="module_customUtilsNode"></a>

## customUtilsNode
<p>Utility functions that need to be reimplemented for each environment.
This is the version for Node.js</p>


* [customUtilsNode](#module_customUtilsNode)
    * [.uid(len)](#module_customUtilsNode.uid) ⇒ <code>string</code>
    * [.uid(len)](#module_customUtilsNode.uid) ⇒ <code>string</code>

<a name="module_customUtilsNode.uid"></a>

### customUtilsNode.uid(len) ⇒ <code>string</code>
<p>Return a random alphanumerical string of length len
There is a very small probability (less than 1/1,000,000) for the length to be less than len
(il the base64 conversion yields too many pluses and slashes) but
that's not an issue here
The probability of a collision is extremely small (need 3*10^12 documents to have one chance in a million of a collision)
See http://en.wikipedia.org/wiki/Birthday_problem</p>

**Kind**: static method of [<code>customUtilsNode</code>](#module_customUtilsNode)  

| Param | Type |
| --- | --- |
| len | <code>number</code> | 

<a name="module_customUtilsNode.uid"></a>

### customUtilsNode.uid(len) ⇒ <code>string</code>
<p>Return a random alphanumerical string of length len
There is a very small probability (less than 1/1,000,000) for the length to be less than len
(il the base64 conversion yields too many pluses and slashes) but
that's not an issue here
The probability of a collision is extremely small (need 3*10^12 documents to have one chance in a million of a collision)
See http://en.wikipedia.org/wiki/Birthday_problem</p>

**Kind**: static method of [<code>customUtilsNode</code>](#module_customUtilsNode)  

| Param | Type |
| --- | --- |
| len | <code>number</code> | 

