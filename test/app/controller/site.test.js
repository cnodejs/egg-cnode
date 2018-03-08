'use strict';

const { app } = require('egg-mock/bootstrap');

describe('test/app/controller/site.test.js', () => {
  it('should GET /sitemap.xml', async () => {
    await app.httpRequest()
      .get('/sitemap.xml')
      .expect(200)
      .expect('content-type', 'application/xml');
  });

  it('should GET /app/download', async () => {
    await app.httpRequest()
      .get('/app/download')
      .expect(302)
      .expect('location', 'https://github.com/soliury/noder-react-native/blob/master/README.md');
  });

  it('should GET /', async () => {
    await app.httpRequest()
      .get('/')
      .expect(200)
      .expect('content-type', 'text/html; charset=utf-8');
  });
});
