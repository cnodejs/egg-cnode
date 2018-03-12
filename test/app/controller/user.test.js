'use strict';

const tools = require('../../../app/common/tools');
const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/user.test.js', () => {
  let loginname;
  let email;
  let user;
  let ctx;

  before(async function() {
    ctx = app.mockContext();
    loginname = `user_loginname_${Date.now()}`;
    email = `${loginname}@test.com`;
    user = await ctx.service.user.newAndSave('name', loginname, tools.bhash('pass'), email, 'avatar_url', 'active');
    assert(user.loginname === loginname);
  });

  describe('- Index', () => {
    it('should GET /user ok', async () => {
      user.url = 'test_url';
      await user.save();

      const r1 = await app.httpRequest().get('/user');
      assert(r1.status === 404);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(r1.text)[1] === 'Not Found');

      const r2 = await app.httpRequest().get('/user/unexisted_user');
      assert(r2.status === 404);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(r2.text)[1] === '这个用户不存在。');

      const res = await app.httpRequest().get(`/user/${loginname}`);
      assert(res.status === 200);
      assert(/<img src="([^"]+)" title=/g.exec(res.text)[1] === user.avatar);
      assert(/<a class="dark">([^"]+)<\/a>/g.exec(res.text)[1] === user.loginname);
      assert(/<span class="big">([^"]+)<\/span> 积分/g.exec(res.text)[1] === user.score.toString());
      assert(/“([\S\s]+)”/g.exec(res.text)[1].replace(/[\t\s]+/g, '') === '这家伙很懒，什么个性签名都没有留下。');
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
      const nologinRes = await app.httpRequest().get('/setting');
      assert(nologinRes.status === 403);
      assert(nologinRes.text === 'forbidden!');

      app.mockContext({ user });
      await app.httpRequest().get('/setting').expect(200);
      const { text } = await app.httpRequest().get('/setting?save=success');
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(text)[1] === '保存成功。');
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
      const res1 = await app.httpRequest()
        .post('/setting')
        .type('form')
        .send({
          action: 'change_password',
          old_pass: '',
          new_pass: '',
        });
      assert(res1.status === 200);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(res1.text)[1] === '旧密码或新密码不得为空');

      const res2 = await app.httpRequest()
        .post('/setting')
        .type('form')
        .send({
          action: 'change_password',
          old_pass: 'worngPass',
          new_pass: 'worngPass',
        });
      assert(res2.status === 200);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(res2.text)[1] === '当前密码不正确。');

      const res3 = await app.httpRequest()
        .post('/setting')
        .type('form')
        .send({
          action: 'change_password',
          old_pass: 'pass',
          new_pass: 'newpass',
        });
      assert(res3.status === 200);

      const savedUser = await ctx.service.user.getUserById(user._id);
      const equal = tools.bcompare('newpass', savedUser.pass);
      assert(equal === true);
    });
  });

  describe('- Admin', () => {
    async function handleUserPost(url) {
      delete user.is_admin;
      app.mockCsrf();
      app.mockContext({ user });
      const { text } = await app.httpRequest()
        .post(url)
        .send()
        .expect(200);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(text)[1] === '需要管理员权限。');
    }

    async function handleAdminPost(url, body, cb) {
      // const adminName = Object.keys(app.config.admins)[0];
      // let admin = await ctx.service.user.getUserByLoginName(adminName);
      // if (!admin) {
      //   admin = await ctx.service.user.newAndSave(adminName, adminName, 'pass', 'admin@test.com', 'u', 'active');
      // }
      // const auth_token = admin._id + '$$$$';
      // app.mockCookies({ [app.config.auth_cookie_name]: auth_token });

      user.is_admin = true;
      app.mockCsrf();
      app.mockContext({ user });
      const res = await app.httpRequest().post(url).type('json')
        .send(body);
      assert(res.status === 200);
      assert(res.body.status === 'success');
      const updatedUser = await ctx.service.user.getUserById(user._id);
      cb(updatedUser);
    }

    it('should POST /passport/local set cookies', async () => {
      app.mockCsrf();
      const login = await app.httpRequest().post('/passport/local').send({ name: user.loginname, pass: 'newpass' });
      assert(login.status === 302);
      const cookies = login.headers['set-cookie'];
      const authUser = cookies.find(c => c.indexOf('$$$$') > -1);
      assert(/=([^$]+)\$/g.exec(authUser)[1] === user._id.toString());
      assert(login.headers.location === '/');
    });

    it('should POST /user/set_star no_login reject', async () => {
      app.mockCsrf();
      const res = await app.httpRequest().post('/user/set_star').send();
      assert(res.status === 200);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(res.text)[1] === '你还没有登录。');
    });

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

  describe('- Top100', () => {
    it('should GET /users/top100 ok', async () => {
      await app.httpRequest().get('/users/top100').expect(200);
    });
  });

  describe('- Stars', () => {
    it('should GET /stars ok', async () => {
      await app.httpRequest().get('/stars').expect(200);
    });
  });

  describe('- Records', () => {
    it('should GET /user/:name/collections ok', async () => {
      const noExistedUser = await app.httpRequest().get('/user/no_user/collections');
      assert(noExistedUser.status === 404);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(noExistedUser.text)[1] === '这个用户不存在。');
      await app.httpRequest().get(`/user/${user.loginname}/collections`).expect(200);
    });

    it('should GET /user/:name/topics ok', async () => {
      const noExistedUser = await app.httpRequest().get('/user/no_user/topics');
      assert(noExistedUser.status === 404);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(noExistedUser.text)[1] === '这个用户不存在。');
      await app.httpRequest().get(`/user/${user.loginname}/topics`).expect(200);
    });

    it('should GET /user/:name/replies ok', async () => {
      const noExistedUser = await app.httpRequest().get('/user/no_user/replies');
      assert(noExistedUser.status === 404);
      assert(/<strong>([\S\s]+)<\/strong>/g.exec(noExistedUser.text)[1] === '这个用户不存在。');
      await app.httpRequest().get(`/user/${user.loginname}/replies`).expect(200);
    });
  });
});
