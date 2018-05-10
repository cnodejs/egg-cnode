'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/api/message.test.js', () => {
  let user1,
    user2,
    token,
    messageId,
    topicId;

  before(async function() {
    const ctx = app.mockContext();
    const loginname1 = `loginname1_${Date.now()}`;
    const loginname2 = `loginname2_${Date.now()}`;
    const email1 = `${loginname1}@test.com`;
    const email2 = `${loginname2}@test.com`;
    user1 = await ctx.service.user.newAndSave('name', loginname1, 'pass', email1, 'avatar_url', 'active');
    user2 = await ctx.service.user.newAndSave('name', loginname2, 'pass', email2, 'avatar_url', 'active');
    token = user2.accessToken;
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

    const message = await ctx.service.message.sendAtMessage(user2._id, user1._id, topicId);
    messageId = message._id;
  });

  it('get /message/count should ok', async () => {
    const result = await app.httpRequest().get(`/api/v1/message/count?accesstoken=${token}`);
    assert(result.body.count >= 1);
  });

  it('get /messages should ok', async () => {
    const result = await app.httpRequest().get(`/api/v1/messages?accesstoken=${token}`);
    assert(result.body.data.hasnot_read_messages.length >= 1);
  });

  it('post /message/mark_all should ok', async () => {
    const result = await app.httpRequest().post(`/api/v1/message/mark_all?accesstoken=${token}`);
    assert(result.body.marked_msgs.length >= 1);
  });

  it('post message/mark_one/:msg_id should ok', async () => {
    const result = await app.httpRequest().post(`/api/v1/message/mark_one/${messageId}?accesstoken=${token}`);
    assert.equal(result.body.marked_msg_id, messageId);
  });
});
