# async-parallel
Simplifies invoking tasks in parallel using TypeScript async/await.

This package provides the following functions:
* **Parallel.each** calls a provided function once per input in parallel   
* **Parallel.map** creates a new array with the results of calling a provided function in parallel on every input, the order of the outputs will correspond to the inputs
* **Parallel.invoke** calls a set of provided functions in parallel
* **Parallel.pool** creates a fixed size pool of actins fetching tasks until a false result is obtained, and returns when the pool is drained to zero   

## Parallel.each example
```js
var list = [100, 200, 300]; // provide list of inputs here
await Parallel.each(list, async (item) => {
    // process each item here
});
```

## Parallel.map example
```js
var list = [100, 200, 300]; // provide list of inputs here
var result = await Parallel.map(list, async (item) => {
    // process each item here
});
// result available here
```

## Parallel.invoke example
```js
await Parallel.invoke([
    async () => { /* task #1 here */ },
    async () => { /* task #2 here */ },
    async () => { /* task #3 here */ },
    async () => { /* task #4 here */ },
    async () => { /* task #5 here */ }
]);
```
Note the same result can be achieved without a library using `Promise.all`, however `Parallel.invoke` also supports pooling as discussed below.

## Parallel.pool example
```js
// create several tasks, running no more than 2 at a time
var tasks = [
    async function () { /* task #1 here */ },
    async function () { /* task #2 here */ },
    async function () { /* task #3 here */ },
    async function () { /* task #4 here */ },
    async function () { /* task #5 here */ }
];
await Parallel.pool(2, async () => {
    var task = tasks.shift();
    await task();
    return tasks.length > 0;
});
// all tasks complete here
```


## Getting Started

Make sure you're running Node v4 and TypeScript 1.8 or higher...
```
$ node -v
v4.5.0
$ npm install -g typescript
$ tsc -v
Version 1.8.10
```

Install package...
```
$ npm install async-parallel
```

Write some code...
```js
import * as Parallel from 'async-parallel';
(async function () {
    var list = [100, 200, 300];
    var start = new Date();
    await Parallel.each(list, async (value) => {
        await sleep(value);
        console.log('sleep', value);
    });
    console.log('done', new Date().getTime() - start.getTime());
    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})();
```

Save the above to a file (index.ts), build and run it!
```
$ tsc index.ts --target es6 --module commonjs
$ node index.js
sleep 100
sleep 200
sleep 300
done 303
```

## Concurrency
The number of concurrent actions can be controlled globally using the Parallel.concurrency variable, or at the individual function level.

* concurrency=0 specifies an unlimited number of actions (this is the default).  
* concurrency=1 causes all actions to be performed in series, or one-at-a-time (also helpful for debugging/troubleshooting).
* concurrency>1 limits concurrency such that no more than the specified number of actions will be run at the same time.

Examples:
```js
Parallel.concurrency = 10; // no more than 10 actions running at the same time 
```

```js
await Parallel.each([100, 200, 300], async (item) => {
    // process each item here
}, {concurrency: 2}); // process no more than 2 items at the same time  
```

```js
await Parallel.invoke([
    async () => { /* task #1 here */ },
    async () => { /* task #2 here */ },
    async () => { /* task #3 here */ },
    async () => { /* task #4 here */ },
    async () => { /* task #5 here */ }
], {concurrency: 3}); // process no more than 3 items at the same time
```

## Errors
If one or more actions fail then no further actions will be started and a rollup error will result after all pending actions are complete.
The rollup error will contain a list of individual failures as shown below.

```js
try {
    await Parallel.pool(2, async () => 
        await someRecurringTask());
}
catch (err) {
    console.log(err.message); // print the rollup error message
    for (var item of err.list)
        console.log(item.message); // print each specific error message
}
```