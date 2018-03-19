'use strict';

const { app, assert } = require('egg-mock/bootstrap');
const utility = require('utility');

describe('test/app/controller/sign.test.js', () => {
  const loginname = 'loginname' + Date.now();
  const email = `${loginname}@email.com`;
  const pass = 'pass';
  let ctx,
    key;

  before(async () => {
    ctx = app.mockContext();
  });

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

  it('should POST /signup ok', async () => {
    app.mockCsrf();
    const res = await app.httpRequest()
      .post('/signup')
      .send({
        loginname,
        email,
        pass,
        re_pass: pass,
      });

    assert(res.statusCode === 200);
    assert(res.text.includes('欢迎加入 CNode技术社区！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号'));
  });

  it('should GET /active_account', async () => {
    let res = await app.httpRequest()
      .get('/active_account');
    assert(res.text.includes('用户不存在'));

    res = await app.httpRequest()
      .get(`/active_account?name=${loginname}`);
    assert(res.text.includes('信息有误，帐号无法被激活。'));

    const user = await ctx.service.user.getUserByLoginName(loginname);
    const activeKey = utility.md5(email + user.pass + app.config.session_secret);
    res = await app.httpRequest()
      .get(`/active_account?name=${loginname}&key=${activeKey}`);
    assert(res.text.includes('帐号已被激活，请登录'));

    res = await app.httpRequest()
      .get(`/active_account?name=${loginname}&key=${activeKey}`);
    assert(res.text.includes('帐号已经是激活状态。'));
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

  it('should GET /search_pass', async () => {
    await app.httpRequest()
      .get('/search_pass').expect(200);
  });

  it('should POST /search_pass', async () => {
    app.mockCsrf();
    let res = await app
      .httpRequest()
      .post('/search_pass')
      .send({ email: 'test' });

    assert(res.text.includes('邮箱不合法'));

    res = await app
      .httpRequest()
      .post('/search_pass')
      .send({ email: 'test@test.com' });

    assert(res.text.includes('没有这个电子邮箱。'));

    res = await app
      .httpRequest()
      .post('/search_pass')
      .send({ email });

    assert(res.text.includes('我们已给您填写的电子邮箱发送了一封邮件，请在24小时内点击里面的链接来重置密码。'));
  });

  it('should GET /reset_pass', async () => {
    let res = await app.httpRequest()
      .get('/reset_pass');
    assert(res.statusCode === 403);
    assert(res.text.includes('信息有误，密码无法重置。'));

    const user = await ctx.service.user.getUserByLoginName(loginname);
    key = user.retrieve_key;
    res = await app.httpRequest()
      .get(`/reset_pass?name=${loginname}&key=${key}`);
    assert(res.statusCode === 200);

    await ctx.model.User.findOneAndUpdate({ loginname }, { retrieve_time: '' }).exec();
    res = await app.httpRequest()
      .get(`/reset_pass?name=${loginname}&key=${key}`);
    assert(res.text.includes('该链接已过期，请重新申请。'));
  });

  it('should POST /reset_pass', async () => {
    app.mockCsrf();
    let res = await app
      .httpRequest()
      .post('/reset_pass')
      .send({ psw: 'hi', repsw: 'hihi', name: loginname, key: 'key' });
    assert(res.text.includes('两次密码输入不一致。'));

    res = await app
      .httpRequest()
      .post('/reset_pass')
      .send({ psw: 'hihi', repsw: 'hihi', name: loginname, key: 'key' });
    assert(res.text.includes('错误的激活链接'));

    res = await app
      .httpRequest()
      .post('/reset_pass')
      .send({ psw: 'hihi', repsw: 'hihi', name: loginname, key });
    assert(res.text.includes('你的密码已重置。'));
  });

  it('should POST /signup', async () => {
    app.mockCsrf();
    const res = await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({});

    assert(res.statusCode === 422);
    assert(res.text.includes('信息不完整。'));
  });

  it('should POST /signup loginname less 5', async () => {
    app.mockCsrf();
    const res = await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname: 'logi',
        email: 'email@myemail.com',
        pass,
        re_pass: pass,
      });

    assert(res.statusCode === 422);
    assert(res.text.includes('用户名至少需要5个字符。'));
  });

  it('should POST /signup invalid loginname', async () => {
    app.mockCsrf();
    const res = await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname: 'login@name',
        email: 'email@myemail.com',
        pass,
        re_pass: pass,
      });

    assert(res.statusCode === 422);
    assert(res.text.includes('用户名不合法。'));
  });

  it('should POST /signup invalid email', async () => {
    app.mockCsrf();
    const res = await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname: 'loginname',
        email: 'invalid_email',
        pass,
        re_pass: pass,
      });

    assert(res.statusCode === 422);
    assert(res.text.includes('邮箱不合法。'));
  });

  it('should POST /signup unmatch password', async () => {
    app.mockCsrf();
    const res = await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname: 'loginname',
        email: 'email@myemail.com',
        pass,
        re_pass: '1234567',
      });

    assert(res.statusCode === 422);
    assert(res.text.includes('两次密码输入不一致。'));
  });

  it('should POST /signup user or email in use', async () => {
    app.mockCsrf();
    const res = await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname,
        email,
        pass,
        re_pass: pass,
      });

    assert(res.statusCode === 422);
    assert(res.text.includes('用户名或邮箱已被使用。'));
  });

  it('should GET /passport/github', async () => {
    const res = await app.httpRequest()
      .get('/passport/github');

    assert(res.statusCode === 302);
    const patt = /https:\/\/github\.com\/login\/oauth\/authorize\?response_type=code\&redirect_uri=http%3A%2F%2F127\.0\.0\.1%3A(\d+)%2Fpassport%2Fgithub%2Fcallback&client_id=test/;
    assert(patt.test(res.headers.location));
  });

});
