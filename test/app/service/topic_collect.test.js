'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/topic_collect.test.js', () => {
  let loginname,
    email,
    userId,
    topicId,
    ctx;
  before(async function() {
    ctx = app.mockContext();
    loginname = `loginname_${Date.now()}`;
    email = `${loginname}@test.com`;
    const user = await ctx.service.user.newAndSave('name', loginname, 'pass', email, 'avatar_url', 'active');
    assert(user.loginname === loginname);
    userId = user._id;
    const title = 'hi';
    const content = 'hello world';
    const tab = 'share';
    const topic = await ctx.service.topic.newAndSave(title, content, tab, userId);
    topicId = topic._id;
    assert(topic.title === title);
    assert(topic.content === content);
    assert(topic.tab === tab);
    assert(topic.author_id === userId);
  });

  it('newAndSave should ok', async () => {
    const result = await ctx.service.topicCollect.newAndSave(userId, topicId);
    assert(result.topic_id === topicId);
    assert(result.user_id === userId);
  });

  it('getTopicCollect should ok', async () => {
    const result = await ctx.service.topicCollect.getTopicCollect(userId, topicId);
    assert.equal(result.topic_id.toString(), topicId);
    assert.equal(result.user_id.toString(), userId);
  });

  it('getTopicCollectsByUserId should ok', async () => {
    const result = await ctx.service.topicCollect.getTopicCollectsByUserId(userId);
    assert(result.length >= 1);
  });

  it('remove should ok', async () => {
    const result = await ctx.service.topicCollect.remove(userId, topicId);
    assert(result.result.ok === 1);
  });
});
