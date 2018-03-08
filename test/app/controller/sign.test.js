'use strict';

const { app } = require('egg-mock/bootstrap');

describe('test/app/controller/sign.test.js', () => {
  const loginname = 'loginname' + Date.now();
  const email = `${loginname}@email.com`;

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

  it('should GET /search_pass', async () => {
    await app.httpRequest()
      .get('/search_pass')
      .expect(200);
  });

  it('should GET /reset_pass', async () => {
    await app.httpRequest()
      .get('/reset_pass')
      .expect(403)
      .expect(/信息有误，密码无法重置。/);
  });

  it('should GET /active_account', async () => {
    await app.httpRequest()
      .get('/active_account')
      .expect(200)
      .expect(/用户不存在/);
  });

  it('should POST /signup', async () => {
    app.mockCsrf();
    await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({})
      .expect(422)
      .expect(/信息不完整。/);
  });

  it('should POST /signup loginname less 5', async () => {
    app.mockCsrf();
    await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname: 'logi',
        email: 'email@myemail.com',
        pass: '123456',
        re_pass: '123456',
      })
      .expect(422)
      .expect(/用户名至少需要5个字符。/);
  });

  it('should POST /signup invalid loginname', async () => {
    app.mockCsrf();
    await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname: 'login@name',
        email: 'email@myemail.com',
        pass: '123456',
        re_pass: '123456',
      })
      .expect(422)
      .expect(/用户名不合法。/);
  });

  it('should POST /signup invalid email', async () => {
    app.mockCsrf();
    await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname: 'loginname',
        email: 'invalid_email',
        pass: '123456',
        re_pass: '123456',
      })
      .expect(422)
      .expect(/邮箱不合法。/);
  });

  it('should POST /signup unmatch password', async () => {
    app.mockCsrf();
    await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname: 'loginname',
        email: 'email@myemail.com',
        pass: '123456',
        re_pass: '1234567',
      })
      .expect(422)
      .expect(/两次密码输入不一致。/);
  });

  it('should POST /signup ok', async () => {
    app.mockCsrf();
    await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname,
        email,
        pass: '123456',
        re_pass: '123456',
      })
      .expect(200)
      .expect(/欢迎加入 cnode！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号/);
  });

  it('should POST /signup user or email in use', async () => {
    app.mockCsrf();
    await app.httpRequest()
      .post('/signup')
      .type('form')
      .send({
        loginname,
        email,
        pass: '123456',
        re_pass: '123456',
      })
      .expect(422)
      .expect(/用户名或邮箱已被使用。/);
  });
});
