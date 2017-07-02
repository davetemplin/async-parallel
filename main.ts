import * as Parallel from './index';

(async function () {
    var list = [100, 200, 300];
    var start = new Date();
    await Parallel.each(list, async value => {
        await Parallel.sleep(value);
        console.log('sleep', value);
    });
    console.log('done', new Date().getTime() - start.getTime());
})();