'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/rss.test.js', () => {
  it('rss should ok', async () => {
    const { config } = app;
    config.debug = false;
    const result1 = await app.httpRequest().get('/rss');
    assert(result1.text.includes('CNode：Node.js专业中文社区'));

    const result2 = await app.httpRequest().get('/rss');
    assert(result2.text.includes('CNode：Node.js专业中文社区'));

    config.rss = null;
    await app.httpRequest().get('/rss').expect(404);
    config.debug = true;
  });
});
