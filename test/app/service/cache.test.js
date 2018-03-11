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
});
