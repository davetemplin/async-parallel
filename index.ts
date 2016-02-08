// Project: https://github.com/davetemplin/async-parallel/
// Written by: Dave Templin <https://github.com/davetemplin/>

export var concurrency = 0;

export async function each<T1, T2>(list: T1[], action: {(value: T1): Promise<T2>}): Promise<void> {
    if (list && list.length > 0) {
        if (concurrency === 1) {
            for (var item of list)
                await action(item);
        }
        else {
            var promises: Promise<T2>[] = [];
            for (var item of list)
                promises.push(action(item));
            await Promise.all(promises);
        }
    }
}

export async function invoke(list: {(): Promise<void>}[]): Promise<void> {
    if (list && list.length > 0) {
        if (concurrency === 1) {
            for (var action of list)
                await action();
        }
        else {
            var promises: Promise<void>[] = [];
            for (var action of list)
                promises.push(action());
            await Promise.all(promises);            
        }
    }
}

export async function map<T1, T2>(list: T1[], action: {(value: T1): Promise<T2>}): Promise<T2[]> {
    var result: T2[] = [];
    if (list && list.length > 0) {
        if (concurrency === 1) {
            for (var item of list)
                result.push(await action(item));
        }
        else {
            var tasks: Task<T2>[] = [];
            var promises: Promise<void>[] = [];        
            for (var i = 0; i < list.length; i++) {
                var task = {
                    index: i,
                    promise: action(list[i]),
                    result: <T2>null
                };
                var promise = (async function (target: Task<T2>): Promise<void> {
                    target.result = await target.promise;
                })(task);
                tasks.push(task);
                promises.push(promise);
            }                    
            await Promise.all(promises);
            tasks = tasks.sort((a,b) => a.index - b.index);
            for (var task of tasks)
                result.push(task.result);
        }            
    }
    return result;
            
    interface Task<T> {
        index: number;
        promise: Promise<T>;
        result: T;
    }                    
}