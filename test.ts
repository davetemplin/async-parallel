// Project: https://github.com/davetemplin/async-parallel/
// Written by: Dave Templin <https://github.com/davetemplin/>

import * as Parallel from './index';
import * as path from 'path';
import {assert} from 'chai';

describe('all', function () {    
    
    describe('Parallel', function () {
        
        it('each', async function () {
            var list = [10, 20, 30];
            var result = 0;
            var start = new Date();
            await Parallel.each(list, async function (value): Promise<void> {
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
            var result = await Parallel.map(list, async function (value): Promise<number> {
                await sleep(value);
                return value / 10;
            });
            assert(result.join(',') === '5,2,1,4');
        });
    });
});

async function sleep(milliseconds: number): Promise<void> {
    return new Promise<void>(resolve => 
        setTimeout(() => 
            resolve(), milliseconds));
}