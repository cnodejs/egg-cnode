'use strict';

const { app } = require('egg-mock/bootstrap');

describe('test/app/controller/site.test.js', () => {
  it('should GET /sitemap.xml', async () => {
    await app.httpRequest()
      .get('/sitemap.xml')
      .expect(200);
  });
});
