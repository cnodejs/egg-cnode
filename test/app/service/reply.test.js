'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/apply.test.js', () => {
  let loginname,
    ctx,
    replyService,
    replyId,
    userId,
    topicId,
    email;
  before(async function() {
    // 创建 ctx
    ctx = app.mockContext();
    replyService = ctx.service.reply;
    loginname = `loginname_${Date.now()}`;
    email = `${loginname}@test.com`;
    const user = await ctx.service.user.newAndSave('name', loginname, 'pass', email, 'avatar_url', 'active');
    const topic = await ctx.service.topic.newAndSave('first post', 'hello', 'share', userId);
    topicId = topic._id;
    const reply = await replyService.newAndSave('hi', topicId, userId);
    replyId = reply._id;
    userId = user._id;
    assert(user.loginname === loginname);
  });
});
