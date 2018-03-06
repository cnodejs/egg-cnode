'use strict';

const { app } = require('egg-mock/bootstrap');

describe('test/app/controller/sign.test.js', () => {
  it('should GET /signup', async () => {
    await app.httpRequest()
      .get('/signup')
      .expect(200);
  });

  it('should POST /signup', async () => {
    await app.httpRequest()
      .post('/signup')
      .expect(403);
  });

  it('should GET /signin', async () => {
    await app.httpRequest()
      .get('/signin')
      .expect(200);
  });

  it('should GET /signout', async () => {
    await app.httpRequest()
      .get('/signout')
      .expect(302);
  });

});
