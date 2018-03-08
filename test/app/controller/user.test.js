'use strict';

const tools = require('../../../app/common/tools');
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
    user = await ctx.service.user.newAndSave('name', loginname, tools.bhash('pass'), email, 'avatar_url', 'active');
    assert(user.loginname === loginname);
  });

  describe('- Index', () => {
    it('should GET /user ok', async () => {
      await app.httpRequest().get('/user').expect(404);
      await app.httpRequest().get('/user/unexisted_user').expect(404);
      await app.httpRequest().get(`/user/${loginname}`).expect(200);
    });
  });

  describe('- Setting', () => {
    const body = {
      url: 'new_url',
      location: 'new_location',
      signature: 'new_signature',
      weibo: 'new_weibo',
    };

    it('should GET /setting ok', async () => {
      await app.httpRequest().get('/setting').expect(403);

      app.mockContext({ user });
      await app.httpRequest().get('/setting').expect(200);
    });


    it('should POST /setting change setting ok', async () => {
      app.mockCsrf();
      app.mockContext({ user });
      const res = await app.httpRequest()
        .post('/setting')
        .type('form')
        .send(Object.assign({}, body, { action: 'change_setting' }));
      assert(res.status === 302);
      assert(res.headers.location === '/setting?save=success');

      const savedUser = await ctx.service.user.getUserById(user._id);
      Object.keys(body).forEach(item => {
        assert(savedUser[item] === body[item]);
      });
    });

    it('should POST /setting change password ok', async () => {
      app.mockCsrf();
      app.mockContext({ user });
      const { status } = await app.httpRequest()
        .post('/setting')
        .type('form')
        .send({
          action: 'change_password',
          old_pass: 'pass',
          new_pass: 'newpass',
        });
      assert(status === 200);

      const savedUser = await ctx.service.user.getUserById(user._id);
      const equal = tools.bcompare('newpass', savedUser.pass);
      assert(equal === true);
    });
  });

  describe('- Admin', () => {
    async function handleUserPost(url) {
      app.mockCsrf();
      app.mockContext({ user });
      const { text } = await app.httpRequest()
        .post(url)
        .type('form')
        .send()
        .expect(200);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(text)[1] === '需要管理员权限。');
    }

    async function handleAdminPost(url, body, cb) {
      const adminName = Object.keys(app.config.admins)[0];
      let admin = await ctx.service.user.getUserByLoginName(adminName);
      if (!admin) {
        admin = await ctx.service.user.newAndSave(adminName, adminName, 'pass', 'admin@test.com', 'u', 'active');
      }
      const auth_token = admin._id + '$$$$';
      app.mockCookies({ [app.config.auth_cookie_name]: auth_token });
      app.mockCsrf();
      app.mockContext({ user: admin });
      const res = await app.httpRequest()
        .post(url)
        .type('json')
        .send(body)
        .expect(200);
      assert(res.body.status === 'success');
      const updatedUser = await ctx.service.user.getUserById(user._id);
      cb(updatedUser);
    }

    it('should POST /user/set_star no_admin reject', async () => {
      await handleUserPost('/user/set_star');
    });


    it('should POST /user/set_star ok', async () => {
      await handleAdminPost('/user/set_star', { user_id: user._id }, user => {
        assert(user.is_star === true);
      });
    });

    it('should POST /user/cancel_star ok', async () => {
      await handleAdminPost('/user/cancel_star', { user_id: user._id }, user => {
        assert(user.is_star === false);
      });
    });

    it('should POST /user/:name/block no_admin reject', async () => {
      await handleUserPost(`/user/${user.loginname}/block`);
    });

    it('should POST /user/:name/block set block ok', async () => {
      await handleAdminPost(`/user/${user.loginname}/block`, { action: 'set_block' }, user => {
        assert(user.is_block === true);
      });
    });

    it('should POST /user/:name/block cancel block ok', async () => {
      await handleAdminPost(`/user/${user.loginname}/block`, { action: 'cancel_block' }, user => {
        assert(user.is_block === false);
      });
    });

    it('should POST /user/:name/delete_all no_admin reject', async () => {
      await handleUserPost(`/user/${user.loginname}/delete_all`);
    });

    it('should POST /user/:name/delete_all ok', async () => {
      await handleAdminPost(`/user/${user.loginname}/delete_all`, {}, user => {
        assert(user);
        // TODO: Check topics and replies by service method.
      });
    });
  });
});
