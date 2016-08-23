// Project: https://github.com/davetemplin/async-parallel/
// Written by: Dave Templin <https://github.com/davetemplin/>

export var concurrency = 0;

export class MultiError extends Error {
    constructor(public list: Array<Error>) {
        super(`${list.length} errors`);
    }
}

export interface Options {
    concurrency: number;
}

export async function each<T1, T2>(list: T1[], action: {(value: T1): Promise<T2>}, options?: Options): Promise<void> {
    if (list && list.length > 0) {
        list = list.slice(0);
        var size = options ? options.concurrency : concurrency;
        if (size === 0)
            size = list.length;
        await pool(size, async () => {
            if (list.length > 0)
                await action(list.shift());
            return list.length > 0;
        });
    }
}

export async function filter<T>(list: T[], action: {(value: T, index: number, list: T[]): Promise<boolean>}, options?: Options): Promise<T[]> {
    var result: T[] = [];
    if (list && list.length > 0) {
        var clone = list.slice(0);
        var size = options ? options.concurrency : concurrency;
        if (size === 0)
            size = clone.length;

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

export async function invoke(list: {(): Promise<void>}[], options?: Options): Promise<void> {
    if (list && list.length > 0) {
        list = list.slice(0);
        var size = options ? options.concurrency : concurrency;
        if (size === 0)
            size = list.length;
        await pool(size, async () => {
            if (list.length > 0)
                await list.shift().call(this);
            return list.length > 0;
        });
    }
}

export async function map<T1, T2>(list: T1[], action: {(value: T1): Promise<T2>}, options?: Options): Promise<T2[]> {
    var result: T2[] = [];
    if (list && list.length > 0) {
        list = list.slice(0);
        var size = options ? options.concurrency : concurrency;
        if (size === 0)
            size = list.length;

        var i = 0;
        var result: T2[] = [];
        await pool(size, async () => {
            if (list.length > 0) {
                var j = i++;
                result[j] = await action(list.shift());
            }
            return list.length > 0;
        });
    }
    return result;
}

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