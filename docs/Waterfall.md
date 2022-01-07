<a name="Waterfall"></a>

## Waterfall
<p>Responsible for sequentially executing actions on the database</p>

**Kind**: global class  

* [Waterfall](#Waterfall)
    * [new Waterfall()](#new_Waterfall_new)
    * [.guardian](#Waterfall+guardian) ⇒ <code>Promise</code>
    * [.waterfall(func)](#Waterfall+waterfall) ⇒ [<code>AsyncFunction</code>](#AsyncFunction)
    * [.chain(promise)](#Waterfall+chain) ⇒ <code>Promise</code>

<a name="new_Waterfall_new"></a>

### new Waterfall()
<p>Instantiate a new Waterfall.</p>

<a name="Waterfall+guardian"></a>

### waterfall.guardian ⇒ <code>Promise</code>
<p>Getter that gives a Promise which resolves when all tasks up to when this function is called are done.</p>
<p>This Promise cannot reject.</p>

**Kind**: instance property of [<code>Waterfall</code>](#Waterfall)  
<a name="Waterfall+waterfall"></a>

### waterfall.waterfall(func) ⇒ [<code>AsyncFunction</code>](#AsyncFunction)
**Kind**: instance method of [<code>Waterfall</code>](#Waterfall)  
**Params**

- func [<code>AsyncFunction</code>](#AsyncFunction)

<a name="Waterfall+chain"></a>

### waterfall.chain(promise) ⇒ <code>Promise</code>
<p>Shorthand for chaining a promise to the Waterfall</p>

**Kind**: instance method of [<code>Waterfall</code>](#Waterfall)  
**Params**

- promise <code>Promise</code>

