'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/page.test.js', () => {
  it('should GET /about', async () => {
    const { status } = await app.httpRequest().get('/about');
    assert(status === 200);
  });

  it('should GET /faq', async () => {
    await app.httpRequest()
      .get('/faq')
      .expect(200);
  });

  it('should GET /getstart', async () => {
    await app.httpRequest()
      .get('/getstart')
      .expect(200);
  });

  it('should GET /robots.txt', async () => {
    await app.httpRequest()
      .get('/robots.txt')
      .expect(200);
  });

  it('should GET /api', async () => {
    await app.httpRequest()
      .get('/api')
      .expect(200);
  });
});
