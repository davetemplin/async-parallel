// Project: https://github.com/davetemplin/async-parallel/
// Written by: Dave Templin <https://github.com/davetemplin/>

/**
 * A list of errors resulting from a parallel function.
 */
export class MultiError extends Error {
    constructor(public list: Array<Error>) {
        super(`${list.length} errors`);
    }
}

/**
 * Defines the options for a parallel function.
 */
export interface Options {
    concurrency: number;
}

/**
 * The current default concurrency setting.
 */
export var concurrency = 0;

/**
 * Sets a default that limits the number of concurrent callback actions for all parallel functions.
 * Specifying the concurrency at the function level supercedes this setting.
 * @param {string} value Specifies the new default concurrency setting.
 */
export function setConcurrency(value: number): void {
    concurrency = value;
}

/**
 * Calls a provided function once per input in parallel.
 * @param list A list of input elements to iterate.
 * @param action An async function callback invoked for each element in the list. The callback takes three arguments: the current element being processed, the index of the current element, and the input list.
 * @param options Limits the number of callback actions to run concurrently.
 */
export async function each<T1, T2>(list: T1[], action: {(value: T1): Promise<T2>}, options?: Options|number): Promise<void> {
    if (list && list.length > 0) {
        list = list.slice(0);
        var size = resolveOptions(options).concurrency || list.length;
        await pool(size, async () => {
            if (list.length > 0)
                await action(list.shift());
            return list.length > 0;
        });
    }
}



/**
 * Tests whether all elements in the array pass the test implemented by the provided function.
 * @param list A list of input elements to test.
 * @param action An async function callback invoked for each element in the list. The callback takes three arguments: the current element being processed, the index of the current element, and the input list. The callback resolves to true for elements that pass the test.
 * @param options Limits the number of callback actions to run concurrently.
 * @returns Returns true if every test resolved to true, otherwise false.
 */
export async function every<T>(list: T[], action: {(value: T, index: number, list: T[]): Promise<boolean>}, options?: Options|number): Promise<boolean> {
    var result = true;
    if (list && list.length > 0) {
        list = list.slice(0);
        var size = resolveOptions(options).concurrency || list.length;
        var i = 0;
        await pool(size, async () => {
            if (list.length > 0)
                if (!await action(list.shift(), i++, list))
                    result = false;
            return !result || list.length > 0;
        });
    }
    return result;
}

/**
 * Creates a new array with all elements that pass the test implemented by the provided function in parallel.
 * The output will be in the same order as the input.
 * @param list A list of input elements to test.
 * @param action An async function callback invoked for each element in the list. The callback takes three arguments: the current element being processed, the index of the current element, and the input list. The callback resolves to true for elements to be included in the output list.
 * @param options Limits the number of callback actions to run concurrently.
 * @returns A list of filtered elements in the same order as the input.
 */
export async function filter<T>(list: T[], action: {(value: T, index: number, list: T[]): Promise<boolean>}, options?: Options|number): Promise<T[]> {
    var result: T[] = [];
    if (list && list.length > 0) {
        var clone = list.slice(0);
        var size = resolveOptions(options).concurrency || list.length;
        var i = 0;
        await pool(size, async () => {
            if (clone.length > 0) {
                var j = i++;
                var value = clone.shift();
                if (await action(value, i, clone))
                    result[j] = value;
            }
            return clone.length > 0;
        });
    }
    return result.filter(value => value !== undefined);
}

/**
 * Calls a set of provided functions in parallel.
 * @param list A list of async function callbacks to invoke. The callback takes no arguments and resolves to a void.
 * @param options Limits the number of callback actions to run concurrently.
 */
export async function invoke(list: {(): Promise<void>}[], options?: Options|number): Promise<void> {
    if (list && list.length > 0) {
        list = list.slice(0);
        var size = resolveOptions(options).concurrency || list.length;
        await pool(size, async () => {
            if (list.length > 0)
                await list.shift().call(this);
            return list.length > 0;
        });
    }
}

/**
 * Creates a new array with the results of calling a provided function in parallel on every input.
 * The output will be in the same order as the input.
 * @param list A list of input elements to map.
 * @param action An async function callback that produces an element of the output list.  The callback takes three arguments: the current element being processed, the index of the current element, and the input list. The callback resolves to a single output element.
 * @param options Limits the number of callback actions to run concurrently.
 * @returns A list of mapped elements in the same order as the input.
 */
export async function map<T1, T2>(list: T1[], action: {(value: T1, index: number, list: T1[]): Promise<T2>}, options?: Options|number): Promise<T2[]> {
    var result: T2[] = [];
    if (list && list.length > 0) {
        list = list.slice(0);
        var size = resolveOptions(options).concurrency || list.length;
        var i = 0;
        await pool(size, async () => {
            if (list.length > 0) {
                var j = i++;
                result[j] = await action(list.shift(), j, list);
            }
            return list.length > 0;
        });
    }
    return result;
}

/**
 * Repeatedly invokes a provided async function that resolves to a boolean result.
 * A pool of parallel instances is maintained until a true result is obtained, after which no new instances will be invoked.
 * The overall operation is resolved when all existing instances have been resolved.
 * @param size Specifies the size of the pool indicating the number of parallel instances of the provided async function to maintain.
 * @param task The provided async function callback that takes no arguments and resolves to a boolean. Returning true indicates no new instances should be invoked.
 */
export async function pool(size: number, task: {(): Promise<boolean>}): Promise<void> {
        var active = 0;
        var done = false;
        var errors: Array<Error> = [];
        return new Promise<void>((resolve, reject) => {
            next();
            function next(): void {
                while (active < size && !done) {
                    active += 1;
                    task()
                        .then(more => {
                            if (--active === 0 && (done || !more))
                                errors.length === 0 ? resolve() : reject(new MultiError(errors));
                            else if (more)
                                next();
                            else
                                done = true;
                        })
                        .catch(err => {
                            errors.push(err);
                            done = true;
                            if (--active === 0)
                                reject(new MultiError(errors));
                        });
                }
            }
        });
}

/**
 * Applies a function against an accumulator and each value of the array (from left-to-right) to reduce it to a single value.
 * @param list A list of input elements to reduce.
 * @param action An async function callback invoked for each element in the list. The callback takes four arguments: the accumulated value previously returned in the last invocation of the callback or initialValue, the current element being processed, the index of the current element, and the input list. The callback resolves to an updated accumulated value.
 * @param initialValue Value to use as the first argument to the first call of the callback.
 * @param options Limits the number of callback actions to run concurrently.
 * @returns The value that results from the reduction.
 */
export async function reduce<T1, T2>(list: T1[], action: {(accumulator: T2, value: T1, index: number, list: T1[]): Promise<T2>}, value: T2, options?: Options|number): Promise<T2> {
    var result = value;
    if (list && list.length > 0) {
        list = list.slice(0);
        var size = resolveOptions(options).concurrency || list.length;
        var i = 0;
        await pool(size, async () => {
            if (list.length > 0)
                result = await action(result, list.shift(), i++, list);
            return list.length > 0;
        });
    }
    return result;
}

/**
 * Sleeps for the specified duration.
 * @param milliseconds The amount of time to sleep in milliseconds.
 */
export async function sleep(milliseconds: number): Promise<void> {
    return new Promise<void>(resolve => 
        setTimeout(() =>
            resolve(), milliseconds));
}

/**
 * Tests whether some element in the array passes the test implemented by the provided function.
 * @param list A list of input elements to test.
 * @param action An async function callback invoked for each element in the list. The callback takes three arguments: the current element being processed, the index of the current element, and the input list. The callback resolves to true for elements that pass the test.
 * @param options Limits the number of callback actions to run concurrently.
 * @returns Returns true if some (at least one) test resolved to true, otherwise false.
 */
export async function some<T>(list: T[], action: {(value: T, index: number, list: T[]): Promise<boolean>}, options?: Options|number): Promise<boolean> {
    var result = false;
    if (list && list.length > 0) {
        list = list.slice(0);
        var size = resolveOptions(options).concurrency || list.length;
        var i = 0;
        await pool(size, async () => {
            if (list.length > 0)
                if (await action(list.shift(), i++, list))
                    result = true;
            return result || list.length > 0;
        });
    }
    return result;
}

function resolveOptions(value?: Options|number): Options {
    if (typeof value === 'number')
        return {concurrency: value};
    else if (typeof value === 'object')
        return Object.assign({concurrency: concurrency}, value);
    else
        return {concurrency: concurrency};
}