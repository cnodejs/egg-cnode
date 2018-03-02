'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/site.test.js', () => {
  // it('should assert', async function () {
  //   const pkg = require('../../../package.json');
  //   assert(app.config.keys.startsWith(pkg.name));
  // });

  it('should GET /sitemap.xml', async () => {
    await app.httpRequest()
      .get('/sitemap.xml')
      .expect(200);
  });
});
