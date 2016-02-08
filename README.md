# async-parallel
Simplifies invoking tasks in parallel using TypeScript async/await.

This package provides the following functions:
* **Parallel.each** calls a provided function once per input in parallel   
* **Parallel.map** creates a new array with the results of calling a provided function in parallel on every input, the order of the outputs will correspond to the inputs
* **Parallel.invoke** calls a set of provided functions in parallel

## Parallel.each Example
```js
var list = [100, 200, 300]; // provide list of inputs here
await Parallel.each(list, async function (item): Promise<void> {
    // process each item here
});
```

## Parallel.map Example
```js
var list = [100, 200, 300]; // provide list of inputs here
var result = await Parallel.map(list, async function (item): Promise<number> {
    // process each item here
});
// result available here
```

## Parallel.invoke Example
```js
await Parallel.invoke([
    async function (): Promise<void> {
        // first action here
    },
    async function (): Promise<void> {
        // second action here
    },
    async function (): Promise<void> {
        // third action here
    }
}); 
```

## Getting Started

Make sure you're running Node v4 and TypeScript 1.7 or higher...
```
$ node -v
v4.2.6
$ npm install -g typescript
$ tsc -v
Version 1.7.5
```

Install package...
```
$ npm install async-parallel
```

Write some code...
```js
(async function () {
    var list = [100, 200, 300];
    var start = new Date();
    await Parallel.each(list, async function (value) {
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
done 302
```

## Additional Notes
Setting Parallel.concurrency=1 causes all iterations to be performed in series to facilite debugging/troubleshooting.
