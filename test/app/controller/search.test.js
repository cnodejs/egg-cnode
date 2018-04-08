'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/search.test.js', () => {
  it('search null should redirect index', async () => {
    const res = await app.httpRequest().get('/search?q=');
    assert(res.status === 302);
    app.config.search = 'bing';
    const res1 = await app.httpRequest().get('/search?q=test');
    assert(res1.status === 302);
  });

  it('search google should ok', async () => {
    app.config.search = 'google';
    const res = await app.httpRequest().get('/search?q=test');
    assert(res.status === 302);
    assert(res.headers.location.indexOf('https://www.google.com.hk/') > -1);
  });

  it('search baidu ok', async () => {
    app.config.search = 'baidu';
    const res = await app.httpRequest().get('/search?q=test');
    assert(res.status === 302);
    assert(res.headers.location.indexOf('https://www.baidu.com/') > -1);
  });

  it('search local ok', async () => {
    app.config.search = 'local';
    const res = await app.httpRequest().get('/search?q=test');
    assert(res.status === 200);
    const res1 = await app.httpRequest().get('/search?q=test&tab=user');
    assert(res1.status === 200);
    const res2 = await app.httpRequest().get('/search?q=test&tab=topic');
    assert(res2.status === 200);
  });
});
