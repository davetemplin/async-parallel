# async-parallel
Async enabled each(), map(), filter() functions that work just like their standard counterparts, but can be used with async/await and also provide concurrency limiting. Includes built-in typings and JSDoc comments for IntelliSense documentation.

The following iterative functions are provided:

* **Parallel.each** calls a provided function once per input in parallel.
* **Parallel.map** creates a new array with the results of calling a provided function in parallel on every input, the output will be in the same order as the input.
* **Parallel.filter** creates a new array with all elements that pass the test implemented by the provided function in parallel, the output will be in the same order as the input.
* **Parallel.every** tests whether all elements in the array pass the test implemented by the provided function.
* **Parallel.reduce** applies a function against an accumulator and each value of the array (from left-to-right) to reduce it to a single value.
* **Parallel.some** tests whether some element in the array passes the test implemented by the provided function.

Every function above provides a `concurrency` parameter to limit the maximum number of parallel instances at the function call level. In addition, concurrency can be limited at a global level with the following function:

* **Parallel.setConcurrency** sets a default that limits the number of concurrent actions for all parallel functions. Superceded by the `concurrency` parameter at the function-call level.

The following additional utility functions are also provided:

* **Parallel.invoke** calls a set of provided functions in parallel.
* **Parallel.pool** maintains a pool of parallel instances of a provided function until a specified result is obtained.
* **Parallel.sleep** sleeps for the specified duration.

## Parallel.each example
```js
var list = [100, 200, 300]; // provide list of inputs here
await Parallel.each(list, async item => {
    // process each item here
});
```

## Parallel.map example
```js
var list = [100, 200, 300]; // provide list of inputs here
var result = await Parallel.map(list, async item => {
    // process each item here
});
// result available here
```

## Parallel.filter example
```js
var list = [100, 200, 300]; // provide list of inputs here
var result = await Parallel.filter(list, async item => {
    // test each item here returning true to include or false to reject
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
], 2);
```
> Note: The same result can be achieved without a library using `Promise.all`, however `Parallel.invoke` provides an ability to limit the concurrency.
Therefore, in example above only 2 of the tasks will be run at the same time.


## Getting Started

Make sure you're running Node v4 or higher and TypeScript 1.8 or higher...
```
$ node -v
v7.3.3
$ npm install -g typescript
$ tsc -v
Version 2.3.4
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
    await Parallel.each(list, async value => {
        await Parallel.sleep(value);
        console.log('sleep', value);
    });
    console.log('done', new Date().getTime() - start.getTime());
})();
```

Save the above to a file `index.ts`, build and run it!
```
$ tsc index.ts --target es6 --module commonjs
$ node index.js
sleep 100
sleep 200
sleep 300
done 303
```

## Concurrency
The number of concurrent actions can be limited at the function level, or by calling the `Parallel.setConcurrency()` which sets a default concurrency setting.

* concurrency=0 specifies an unlimited number of actions (this is the default).  
* concurrency=1 causes all actions to be performed in series, or one-at-a-time (also useful for debugging/troubleshooting).
* concurrency>1 limits concurrency such that no more than the specified number of actions will be run at the same time.

Examples:
```js
await Parallel.each([100, 200, 300], async item => {
    // process each item here
}, 2); // process no more than 2 items at the same time  
```

```js
await Parallel.invoke([
    async () => { /* task #1 here */ },
    async () => { /* task #2 here */ },
    async () => { /* task #3 here */ },
    async () => { /* task #4 here */ },
    async () => { /* task #5 here */ }
], 3); // process no more than 3 items at the same time
```

```js
Parallel.setConcurrency(10); // no more than 10 actions running at the same time by default
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

## Parallel.pool example
Create several actions, running no more than 2 at a time.

```js
var actions = [
    async function () { /* task #1 here */ },
    async function () { /* task #2 here */ },
    async function () { /* task #3 here */ },
    async function () { /* task #4 here */ },
    async function () { /* task #5 here */ }
];
await Parallel.pool(2, async () => {
    var action = actions.shift();
    await action();
    return action.length > 0;
});
// all actions are complete here
```

# Reference

## each

Calls a provided function once per input in parallel.

`each<T1, T2>(list: T1[], action: {(value: T1): Promise<T2>}, concurrency?: number): Promise<void>`

| Parameter   | Type           | Description                                                                 |
| ----------- | -------------- | --------------------------------------------------------------------------- |
| list        | (generic)      | A list of input elements to iterate.                                        |
| action      | function       | An async function callback invoked for each element in the list. The callback takes three arguments: the current element being processed, the index of the current element, and the input list. |
| concurrency | number         | Limits the number of callback actions to run concurrently.                  |


## every

Tests whether all elements in the array pass the test implemented by the provided function.

`every<T>(list: T[], action: {(value: T, index: number, list: T[]): Promise<boolean>}, concurrency?: number): Promise<boolean>`

| Parameter  | Type            | Description                                                                 |
| ---------- | --------------- | --------------------------------------------------------------------------- |
| list       | (generic)       | A list of input elements to test.                                           |
| action     | function        | An async function callback invoked for each element in the list. The callback takes three arguments: the current element being processed, the index of the current element, and the input list. The callback resolves to true for elements that pass the test. |
| concurrency | number         | Limits the number of callback actions to run concurrently.                  |

Returns true if every test resolved to true, otherwise false.

## filter

Creates a new array with all elements that pass the test implemented by the provided function in parallel.

`filter<T>(list: T[], action: {(value: T, index: number, list: T[]): Promise<boolean>}, concurrency?: number): Promise<T[]>`

| Parameter  | Type            | Description                                                                 |
| ---------- | --------------- | --------------------------------------------------------------------------- |
| list       | (generic)       | A list of input elements to test.                                           |
| action     | function        | An async function callback invoked for each element in the list. The callback takes three arguments: the current element being processed, the index of the current element, and the input list. The callback resolves to true for elements to be included in the output list. |
| concurrency | number         | Limits the number of callback actions to run concurrently.                  |

Returns a list of filtered elements in the same order as the input.

## invoke

Calls a set of provided functions in parallel.

`invoke(list: {(): Promise<void>}[], concurrency?: number): Promise<void>`

| Parameter  | Type            | Description                                                                 |
| ---------- | --------------- | --------------------------------------------------------------------------- |
| list       | function[]      | A list of async function callbacks to invoke. The callback takes no arguments and resolves to a void. |
| concurrency | number         | Limits the number of callback actions to run concurrently.                  |


## map

Creates a new array with the results of calling a provided function in parallel on every input.
The output will be in the same order as the input.

`map<T1, T2>(list: T1[], action: {(value: T1, index: number, list: T1[]): Promise<T2>}, concurrency?: number): Promise<T2[]>`

| Parameter   | Type            | Description                                                                 |
| ----------- | --------------- | --------------------------------------------------------------------------- |
| list        | (generic)       | A list of input elements to map.                                            |
| action      | function        | An async function callback that produces an element of the output list.  The callback takes three arguments: the current element being processed, the index of the current element, and the input list. The callback resolves to a single output element. |
| concurrency | number          | Limits the number of callback actions to run concurrently. |

Returns a list of mapped elements in the same order as the input.


## pool

Repeatedly invokes a provided async function that resolves to a boolean result.
A pool of parallel instances is maintained until a true result is obtained, after which no new instances will be invoked.

`pool(size: number, task: {(): Promise<boolean>}): Promise<void>`

| Parameter | Type     | Description                                                                                                            |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| size      | number   | Specifies the size of the pool indicating the number of parallel instances of the provided async function to maintain. |
| task      | function | The provided async function callback that takes no arguments and resolves to a boolean. Returning true indicates no new instances should be invoked. |

## reduce

Applies a function against an accumulator and each value of the array (from left-to-right) to reduce it to a single value.

`reduce<T1, T2>(list: T1[], action: {(accumulator: T2, value: T1, index: number, list: T1[]): Promise<T2>}, value: T2, concurrency?: number): Promise<T2>`

| Parameter    | Type      | Description                                                                 |
| ------------ | --------- | --------------------------------------------------------------------------- |
| list         | (generic) | A list of input elements to reduce. |
| action       | function  | An async function callback invoked for each element in the list. The callback takes four arguments: the accumulated value previously returned in the last invocation of the callback or initialValue, the current element being processed, the index of the current element, and the input list. The callback resolves to an updated accumulated value. |
| initialValue | (generic) | Value to use as the first argument to the first call of the callback. |
| concurrency  | number    | Limits the number of callback actions to run concurrently. |

Returns the value that results from the reduction.

## setConcurrency

Sets a default that limits the number of concurrent callback actions for all parallel functions.
Specifying the concurrency at the function level supercedes this setting.

`setConcurrency(value: number): void`

| Parameter  | Type            | Description                                                                 |
| ---------- | --------------- | --------------------------------------------------------------------------- |
| value      | number          | Specifies the new default concurrency setting.                              |


## sleep

Sleeps for the specified duration.

`sleep(milliseconds: number): Promise<void>`

| Parameter  | Type            | Description                                                                 |
| ------------ | ------------- | --------------------------------------------------------------------------- |
| milliseconds | number        | The amount of time to sleep in milliseconds.                                |


## some

Tests whether some element in the array passes the test implemented by the provided function.

`some<T>(list: T[], action: {(value: T, index: number, list: T[]): Promise<boolean>}, concurrency?: number): Promise<boolean>`

| Parameter   | Type           | Description                                                                 |
| ----------- | -------------- | --------------------------------------------------------------------------- |
| list        | (generic)      | A list of input elements to test.                                           |
| action      | function       | An async function callback invoked for each element in the list. The callback takes three arguments: the current element being processed, the index of the current element, and the input list. The callback resolves to true for elements that pass the test. |
| concurrency | number         | Limits the number of callback actions to run concurrently.                  |

Returns true if some (at least one) test resolved to true, otherwise false.