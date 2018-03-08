'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/user.test.js', () => {
  let loginname;
  let email;
  let user;
  let ctx;

  before(async function() {
    // 创建 ctx
    ctx = app.mockContext();
    loginname = `loginname_${Date.now()}`;
    email = `${loginname}@test.com`;
    user = await ctx.service.user.newAndSave('name', loginname, 'pass', email, 'avatar_url', 'active');
    assert(user.loginname === loginname);
  });

  // afterEach(app.mock.restore);

  it('should GET /user return 404', async () => {
    const { status } = await app.httpRequest().get('/user');
    assert(status === 404);
  });

  it('should GET /user/:unexisted_user return 404', async () => {
    const { status } = await app.httpRequest().get('/user/unexisted_user');
    assert(status === 404);
  });

  it('should GET /user/:existed_user return 200', async () => {
    const { status } = await app.httpRequest().get(`/user/${loginname}`);
    assert(status === 200);
  });

  it('should GET /setting without session return 403', async () => {
    const { status } = await app.httpRequest().get('/setting');
    assert(status === 403);
  });

  it('should GET /setting with session return 200', async () => {
    app.mockSession({ user });
    const { status } = await app.httpRequest().get('/setting');
    assert(status === 200);
  });

  describe('POST /setting', () => {
    const body = {
      url: 'new_url',
      location: 'new_location',
      signature: 'new_signature',
      weibo: 'new_weibo',
    };

    it('should POST /setting action change_setting, return 302', async () => {
      app.mockCsrf();
      app.mockSession({ user });
      const res = await app.httpRequest()
        .post('/setting')
        .type('form')
        .send(Object.assign({}, body, { action: 'change_setting' }));
      assert(res.status === 302);
      assert(res.headers.location === '/setting?save=success');
    });

    it('should update user setting', async () => {
      const res = await ctx.service.user.getUserById(user._id);
      Object.keys(body).forEach(item => {
        assert(res[item] === body[item]);
      });
    });
  });
});
