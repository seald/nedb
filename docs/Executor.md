<a name="Executor"></a>

## Executor
<p>Executes operations sequentially.
Has an option for a buffer that can be triggered afterwards.</p>

**Kind**: global class  

* [Executor](#Executor)
    * [new Executor()](#new_Executor_new)
    * [.ready](#Executor+ready) : <code>boolean</code>
    * [.queue](#Executor+queue) : [<code>Waterfall</code>](#Waterfall)
    * [.buffer](#Executor+buffer) : [<code>Waterfall</code>](#Waterfall)
    * [._triggerBuffer()](#Executor+_triggerBuffer)
    * [.push(task, [forceQueuing])](#Executor+push)
    * [.pushAsync(task, [forceQueuing])](#Executor+pushAsync) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.processBuffer()](#Executor+processBuffer)

<a name="new_Executor_new"></a>

### new Executor()
<p>Instantiates a new Executor.</p>

<a name="Executor+ready"></a>

### executor.ready : <code>boolean</code>
<p>If this.ready is <code>false</code>, then every task pushed will be buffered until this.processBuffer is called.</p>

**Kind**: instance property of [<code>Executor</code>](#Executor)  
**Access**: protected  
<a name="Executor+queue"></a>

### executor.queue : [<code>Waterfall</code>](#Waterfall)
<p>The main queue</p>

**Kind**: instance property of [<code>Executor</code>](#Executor)  
**Access**: protected  
<a name="Executor+buffer"></a>

### executor.buffer : [<code>Waterfall</code>](#Waterfall)
<p>The buffer queue</p>

**Kind**: instance property of [<code>Executor</code>](#Executor)  
**Access**: protected  
<a name="Executor+_triggerBuffer"></a>

### executor.\_triggerBuffer()
<p>Method to trigger the buffer processing.</p>
<p>Do not be use directly, use <code>this.processBuffer</code> instead.</p>

**Kind**: instance method of [<code>Executor</code>](#Executor)  
**Access**: protected  
<a name="Executor+push"></a>

### executor.push(task, [forceQueuing])
<p>If executor is ready, queue task (and process it immediately if executor was idle)
If not, buffer task for later processing</p>

**Kind**: instance method of [<code>Executor</code>](#Executor)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| task | <code>Object</code> |  |  |
| task.this | <code>Object</code> |  | <p>Object to use as this</p> |
| task.fn | <code>function</code> |  | <p>Function to execute</p> |
| task.arguments | <code>Array</code> |  | <p>Array of arguments, IMPORTANT: only the last argument may be a function (the callback) and the last argument cannot be false/undefined/null</p> |
| [forceQueuing] | <code>Boolean</code> | <code>false</code> | <p>Optional (defaults to false) force executor to queue task even if it is not ready</p> |

<a name="Executor+pushAsync"></a>

### executor.pushAsync(task, [forceQueuing]) ⇒ <code>Promise.&lt;\*&gt;</code>
<p>If executor is ready, queue task (and process it immediately if executor was idle)
If not, buffer task for later processing</p>

**Kind**: instance method of [<code>Executor</code>](#Executor)  

| Param | Type | Default |
| --- | --- | --- |
| task | <code>function</code> |  | 
| [forceQueuing] | <code>boolean</code> | <code>false</code> | 

<a name="Executor+processBuffer"></a>

### executor.processBuffer()
<p>Queue all tasks in buffer (in the same order they came in)
Automatically sets executor as ready</p>

**Kind**: instance method of [<code>Executor</code>](#Executor)  
