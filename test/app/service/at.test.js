'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/at.test.js', () => {
  let topicId,
    loginname1,
    loginname2,
    user1,
    user2,
    ctx,
    atService;
  before(async function() {
    ctx = app.mockContext();
    atService = ctx.service.at;
    loginname1 = `loginname1_${Date.now()}`;
    loginname2 = `loginname2_${Date.now()}`;
    user1 = await ctx.service.user.newAndSave('name', loginname1, 'pass', `${loginname1}@test.com`, 'avatar_url', 'active');
    user2 = await ctx.service.user.newAndSave('name', loginname2, 'pass', `${loginname2}@test.com`, 'avatar_url', 'active');
    assert(user1.loginname === loginname1);
    assert(user2.loginname === loginname2);

    const title = 'first post';
    const content = 'hello world';
    const tab = 'share';
    const topic = await ctx.service.topic.newAndSave(title, content, tab, user1._id);
    topicId = topic._id;
    assert(topic.title === title);
    assert(topic.content === content);
    assert(topic.tab === tab);
    assert.equal(topic.author_id, user1._id);

    const reply = await ctx.service.reply.newAndSave('hi', topicId, user1._id);
    assert(reply.content === 'hi');
    assert(reply.author_id === user1._id);
    assert(reply.topic_id === topicId);
  });

  it('fetchUsers should ok', async () => {
    let result = await atService.fetchUsers();
    assert(result.length === 0);
    result = await ctx.service.at.fetchUsers('good job!!! @sinchang @cnode');
    assert(result[0] === 'sinchang');
    assert(result[1] === 'cnode');
  });

  it('sendMessageToMentionUsers should ok', async () => {
    const result = await atService.sendMessageToMentionUsers(`hi!!!@${loginname2}`, topicId, user1._id);
    assert(result[0].type === 'at');
    assert(result[0].topic_id === topicId);
    assert(result[0].author_id === user1._id);
    assert.equal(result[0].master_id.toString(), user2._id);
    assert(result[0].reply_id === null);
  });

  it('linkUsers should ok', async () => {
    const result = await atService.linkUsers(`hi!!!@${loginname2}`);
    assert(result === `hi!!![@${loginname2}](/user/${loginname2})`);
  });
});
