'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/site.test.js', () => {
  it('should GET /sitemap.xml', async () => {
    const { status, headers } = await app.httpRequest().get('/sitemap.xml');
    assert(status === 200);
    assert(headers['content-type'] === 'application/xml');
  });

  it('should GET /app/download', async () => {
    const { status, headers } = await app.httpRequest().get('/app/download');
    assert(status === 302);
    assert(headers.location === 'https://github.com/soliury/noder-react-native/blob/master/README.md');
  });

  it('should GET /', async () => {
    const { status, headers } = await app.httpRequest().get('/');
    assert(status === 200);
    assert(headers['content-type'] === 'text/html; charset=utf-8');
  });
});
