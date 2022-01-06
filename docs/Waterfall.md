<a name="Waterfall"></a>

## Waterfall
**Kind**: global class  

* [Waterfall](#Waterfall)
    * [new Waterfall()](#new_Waterfall_new)
    * [._guardian](#Waterfall+_guardian) : <code>Promise</code>
    * [.guardian](#Waterfall+guardian) ⇒ <code>Promise</code>
    * [.waterfall(func)](#Waterfall+waterfall) ⇒ [<code>AsyncFunction</code>](#AsyncFunction)
    * [.chain(promise)](#Waterfall+chain) ⇒ <code>Promise</code>

<a name="new_Waterfall_new"></a>

### new Waterfall()
<p>Instantiate a new Waterfall.</p>

<a name="Waterfall+_guardian"></a>

### waterfall.\_guardian : <code>Promise</code>
<p>This is the internal Promise object which resolves when all the tasks of the <code>Waterfall</code> are done.</p>
<p>It will change any time <code>this.waterfall</code> is called.</p>
<p>Use [guardian](#Waterfall+guardian) instead which retrievethe latest version of the guardian.</p>

**Kind**: instance property of [<code>Waterfall</code>](#Waterfall)  
**Access**: protected  
<a name="Waterfall+guardian"></a>

### waterfall.guardian ⇒ <code>Promise</code>
<p>Getter that gives a Promise which resolves when all tasks up to when this function is called are done.</p>
<p>This Promise cannot reject.</p>

**Kind**: instance property of [<code>Waterfall</code>](#Waterfall)  
<a name="Waterfall+waterfall"></a>

### waterfall.waterfall(func) ⇒ [<code>AsyncFunction</code>](#AsyncFunction)
**Kind**: instance method of [<code>Waterfall</code>](#Waterfall)  

| Param | Type |
| --- | --- |
| func | [<code>AsyncFunction</code>](#AsyncFunction) | 

<a name="Waterfall+chain"></a>

### waterfall.chain(promise) ⇒ <code>Promise</code>
<p>Shorthand for chaining a promise to the Waterfall</p>

**Kind**: instance method of [<code>Waterfall</code>](#Waterfall)  

| Param | Type |
| --- | --- |
| promise | <code>Promise</code> | 

