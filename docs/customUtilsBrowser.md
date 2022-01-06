<a name="module_customUtilsBrowser"></a>

## customUtilsBrowser
<p>Utility functions that need to be reimplemented for each environment.
This is the version for the browser &amp; React-Native</p>


* [customUtilsBrowser](#module_customUtilsBrowser)
    * [~randomBytes(size)](#module_customUtilsBrowser..randomBytes) ⇒ <code>array.&lt;number&gt;</code>
    * [~byteArrayToBase64(uint8)](#module_customUtilsBrowser..byteArrayToBase64) ⇒ <code>string</code>

<a name="module_customUtilsBrowser..randomBytes"></a>

### customUtilsBrowser~randomBytes(size) ⇒ <code>array.&lt;number&gt;</code>
<p>Taken from the crypto-browserify module
https://github.com/dominictarr/crypto-browserify
NOTE: Math.random() does not guarantee &quot;cryptographic quality&quot; but we actually don't need it</p>

**Kind**: inner method of [<code>customUtilsBrowser</code>](#module_customUtilsBrowser)  

| Param | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | <p>in bytes</p> |

<a name="module_customUtilsBrowser..byteArrayToBase64"></a>

### customUtilsBrowser~byteArrayToBase64(uint8) ⇒ <code>string</code>
<p>Taken from the base64-js module
https://github.com/beatgammit/base64-js/</p>

**Kind**: inner method of [<code>customUtilsBrowser</code>](#module_customUtilsBrowser)  

| Param | Type |
| --- | --- |
| uint8 | <code>array</code> | 

