<a name="Executor"></a>

## Executor
<p>Executes operations sequentially.
Has an option for a buffer that can be triggered afterwards.</p>

**Kind**: global class  

* [Executor](#Executor)
    * [new Executor()](#new_Executor_new)
    * [.push(task, [forceQueuing])](#Executor+push)
    * [.pushAsync(task, [forceQueuing])](#Executor+pushAsync) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.processBuffer()](#Executor+processBuffer)

<a name="new_Executor_new"></a>

### new Executor()
<p>Instantiates a new Executor.</p>

<a name="Executor+push"></a>

### executor.push(task, [forceQueuing])
<p>If executor is ready, queue task (and process it immediately if executor was idle)
If not, buffer task for later processing</p>

**Kind**: instance method of [<code>Executor</code>](#Executor)  
**Params**

- task <code>Object</code>
    - .this <code>Object</code> - <p>Object to use as this</p>
    - .fn <code>function</code> - <p>Function to execute</p>
    - .arguments <code>Array</code> - <p>Array of arguments, IMPORTANT: only the last argument may be a function
(the callback) and the last argument cannot be false/undefined/null</p>
- [forceQueuing] <code>Boolean</code> <code> = false</code> - <p>Optional (defaults to false) force executor to queue task even if it is not ready</p>

<a name="Executor+pushAsync"></a>

### executor.pushAsync(task, [forceQueuing]) ⇒ <code>Promise.&lt;\*&gt;</code>
<p>Async version of [push](#Executor+push).
This version is way simpler than its callbackEquivalent: you give it an async function <code>task</code>, it is executed when
all the previous tasks are done, and then resolves or rejects and when it is finished with its original result or
error.</p>

**Kind**: instance method of [<code>Executor</code>](#Executor)  
**See**: Executor#push  
**Params**

- task [<code>AsyncFunction</code>](#AsyncFunction)
- [forceQueuing] <code>boolean</code> <code> = false</code>

<a name="Executor+processBuffer"></a>

### executor.processBuffer()
<p>Queue all tasks in buffer (in the same order they came in)
Automatically sets executor as ready</p>

**Kind**: instance method of [<code>Executor</code>](#Executor)  
