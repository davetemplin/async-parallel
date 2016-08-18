import * as Parallel from './index';
(async function (): Promise<void> {

var list = [100, 200, 300]; // provide list of inputs here
await Parallel.each(list, async (item) => {
    // process each item here
});


    var tasks = [
        async function (): Promise<void> { console.log('task #0 start'); await sleep(10); console.log('task #0 end'); },
        async function (): Promise<void> { console.log('task #1 start'); await sleep(11); console.log('task #1 end'); },
        async function (): Promise<void> { console.log('task #2 start'); await sleep(12); console.log('task #2 end'); },
        async function (): Promise<void> { console.log('task #3 start'); await sleep(13); console.log('task #3 end'); },
        async function (): Promise<void> { console.log('task #4 start'); await sleep(12); console.log('task #4 end'); },
        async function (): Promise<void> { console.log('task #5 start'); await sleep(11); console.log('task #5 end'); }
    ];
    await Parallel.pool(3, async () => {
        var task = tasks.shift();
        await task();
        return tasks.length > 0;
    });
    console.log('done');
})();

async function sleep(milliseconds: number): Promise<void> {
    return new Promise<void>(resolve => 
        setTimeout(() => 
            resolve(), milliseconds));
}