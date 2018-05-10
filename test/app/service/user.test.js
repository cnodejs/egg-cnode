'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/user.test.js', () => {
  let loginname,
    token,
    email;
  before(async function() {
    // 创建 ctx
    const ctx = app.mockContext();
    loginname = `loginname_${Date.now()}`;
    email = `${loginname}@test.com`;
    const result = await ctx.service.user.newAndSave('name',
      loginname, 'pass', email, 'avatar_url', 'active');
    token = result.accessToken;
    assert(result.loginname === loginname);
  });

  it('should ok', function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const result = ctx.service.user.makeGravatar('shyvo1987@gmail.com');
    assert(result === 'http://www.gravatar.com/avatar/31b9dfd78b6aa9cefb68129ea21af3bf?size=48');
  });

  it('getUsersByNames should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    let users = await ctx.service.user.getUsersByNames([]);
    assert(users.length === 0);

    users = await ctx.service.user.getUsersByNames([ loginname ]);
    assert(users.length === 1);
    const user = users[0];
    assert(user.loginname === loginname);
  });

  it('getUsersByToken should ok', async function() {
    const ctx = app.mockContext();
    const user = await ctx.service.user.getUserByToken(token);
    assert(user.loginname === loginname);
  });

  it('getUserByLoginName should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const user = await ctx.service.user.getUserByLoginName(loginname);
    assert(user);
    assert(user.loginname === loginname);
  });

  it('getUserByGithubId should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const user = await ctx.service.user.getUserByGithubId('githubid');
    assert(user === null);
  });

  it('getUserById should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    let user = await ctx.service.user.getUserById('565c4473d0bc14ae279399fe');
    assert(user === null);

    user = await ctx.service.user.getUserById('');
    assert(user === null);
  });

  it('getUserByMail should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const user = await ctx.service.user.getUserByMail('admin@admin.com');
    assert(user === null);
  });

  it('getUsersByIds should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const users = await ctx.service.user.getUsersByIds([ '565c4473d0bc14ae279399fe' ]);
    assert(users.length === 0);
  });

  it('getUsersByQuery should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const users = await ctx.service.user.getUsersByQuery({
      _id: '565c4473d0bc14ae279399fe',
    });
    assert(users.length === 0);
  });

  it('getUserByNameAndKey should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const user = await ctx.service.user.getUserByNameAndKey('admin', 'key');
    assert(user === null);
  });

  it('getGravatar should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();
    const user = await ctx.service.user.getUserByLoginName(loginname);
    assert(user);
    const avatarUrl = ctx.service.user.getGravatar(user);
    assert(avatarUrl === 'avatar_url');
  });

});
