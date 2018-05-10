'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/api/user.test.js', () => {
  let loginname;
  let token;

  before(async function() {
    const ctx = app.mockContext();
    loginname = `user_loginname_${Date.now()}`;
    const email = `${loginname}@test.com`;
    const user = await ctx.service.user.newAndSave('name', loginname, ctx.helper.bhash('pass'), email, 'avatar_url', 'active');
    token = user.accessToken;
    assert(user.loginname === loginname);
  });

  it('get /user/:loginname should ok', async () => {
    await app.httpRequest().get(`/api/v1/user/${loginname}`).expect(200);
    await app.httpRequest().get(`/api/v1/user/${loginname}test`).expect(404);
  });

  it('post /accesstoken should ok', async () => {
    await app.httpRequest()
      .post('/api/v1/accesstoken')
      .send({ accesstoken: token })
      .expect(200);
    await app.httpRequest()
      .post('/api/v1/accesstoken')
      .expect(401);
  });
});
