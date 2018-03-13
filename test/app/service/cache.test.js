'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/cache.test.js', () => {
  it('set value should ok', async () => {
    const ctx = app.mockContext();
    const result = await ctx.service.cache.setex('greet', 'hi', 300);
    assert(result === undefined);
  });

  it('get value should ok', async () => {
    const ctx = app.mockContext();
    const result1 = await ctx.service.cache.get('greet');
    assert(result1 === 'hi');
    const result2 = await ctx.service.cache.get('greet123');
    assert(result2 === undefined);
  });

  it('incr should ok', async () => {
    const ctx = app.mockContext();
    const key1 = '' + Date.now();

    let initNumber = await ctx.service.cache.incr(key1, 4);
    assert(initNumber === 1);
    await new Promise(resolve => setTimeout(resolve, 2000));
    let secondNumber = await ctx.service.cache.incr(key1, 1);
    assert(secondNumber === 2);

    // test expire works
    const key2 = '' + Date.now();
    initNumber = await ctx.service.cache.incr(key2, 2);
    assert(initNumber === 1);
    await new Promise(resolve => setTimeout(resolve, 3000));
    secondNumber = await ctx.service.cache.incr(key2, 1);
    assert(secondNumber === 1);
  });
});
