// Project: https://github.com/davetemplin/async-parallel/
// Written by: Dave Templin <https://github.com/davetemplin/>

import * as Parallel from './index';
import {sleep} from './index';
import * as path from 'path';
import {assert} from 'chai';

describe('all', function () {    
    
    describe('Parallel', function () {

        it('pool', async function () {
            var n = 0;
            var tasks = [
                async function (): Promise<void> { n++; await sleep(10); n--; },
                async function (): Promise<void> { n++; await sleep(11); n--; },
                async function (): Promise<void> { n++; await sleep(12); n--; },
                async function (): Promise<void> { n++; await sleep(13); n--; },
                async function (): Promise<void> { n++; await sleep(12); n--; },
                async function (): Promise<void> { n++; await sleep(11); n--; }
            ];
            await Parallel.pool(3, async () => {
                var task = tasks.shift();
                if (task)
                    await task();
                return tasks.length > 0;
            });
            assert(tasks.length === 0);
            assert(n === 0);
        });
        
        it('each', async function () {
            var list = [10, 20, 30];
            var result = 0;
            var start = new Date();
            await Parallel.each(list, async (value) => {
                await sleep(value);
                result += value;
            });
            assert(result === 60);            
        });

        it ('invoke', async function () {
            var result: number = 0;
            await Parallel.invoke([
                async function (): Promise<void> {
                    await sleep(10);
                    result += 10;
                },
                async function (): Promise<void> {
                    await sleep(20);
                    result += 20;
                },
                async function (): Promise<void> {
                    await sleep(30);
                    result += 30;
                }
            ]);
            assert(result === 60);
        });
        
        it('map', async function () {
            var list = [50, 20, 10, 40];
            var result = await Parallel.map(list, async (value) => {
                await sleep(value);
                return value / 10;
            });
            assert(result.join(',') === '5,2,1,4');
        });

        it('filter', async function () {
            var list = [51, 50, 20, 21, 10, 40, 41];
            var result = await Parallel.filter(list, async (value) => {
                await sleep(value);
                return value % 10 === 0;
            });
            assert(result.join(',') === '50,20,10,40');
        });

        it('each empty', async function () {
            var flag = false;
            await Parallel.each([], async () => flag = true);
            assert(flag === false);
        });

        it('each null', async function () {
            var flag = false;
            await Parallel.each(<any>null, async () => flag = true);
            assert(flag === false);
        });

        it('each undefined', async function () {
            var flag = false;
            await Parallel.each(<any>undefined, async () => flag = true);
            assert(flag === false);
        });
                
    });
});