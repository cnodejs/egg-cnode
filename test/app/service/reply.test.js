'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/reply.test.js', () => {
  let loginname,
    ctx,
    replyService,
    replyId,
    userId,
    topicId,
    email;
  before(async function() {
    ctx = app.mockContext();
    replyService = ctx.service.reply;
    loginname = `loginname_${Date.now()}`;
    email = `${loginname}@test.com`;
    const user = await ctx.service.user.newAndSave('name', loginname, 'pass', email, 'avatar_url', 'active');
    const topic = await ctx.service.topic.newAndSave('first post', 'hello', 'share', userId);
    topicId = topic._id;
    userId = user._id;
    assert(user.loginname === loginname);
  });

  it('newAndSave should ok', async () => {
    const result = await replyService.newAndSave('hi', topicId, userId);
    replyId = result._id;
    assert.equal(result.author_id, userId);
  });

  it('getReply should ok', async () => {
    const result = await replyService.getReply(replyId);
    assert.equal(result._id.toString(), replyId);
  });

  it('getReplyById should ok', async () => {
    const result = await replyService.getReplyById(replyId);
    assert.equal(result._id.toString(), replyId);
  });

  it('getReplyById return null when reply id is empty', async () => {
    const result = await replyService.getReplyById();
    assert(result === null);
  });

  it('getRepliesByTopicId should ok', async () => {
    const result1 = await replyService.getRepliesByTopicId();
    assert(result1.length === 0);
    const result2 = await replyService.getRepliesByTopicId(topicId);
    assert.equal(result2[0].topic_id.toString(), topicId);
  });

  it('getLastReplyByTopId should ok', async () => {
    const result = await replyService.getLastReplyByTopId(topicId);
    assert.equal(result[0]._id.toString(), replyId);
  });

  it('getRepliesByAuthorId should ok', async () => {
    const result = await replyService.getRepliesByAuthorId(userId);
    assert(result.length >= 1);
  });

  it('getCountByAuthorId should ok', async () => {
    const result = await replyService.getCountByAuthorId(userId);
    assert(result >= 1);
  });

  it('newAndSave should ok when has reply id', async () => {
    const result = await replyService.newAndSave('hi', topicId, userId, replyId);
    assert.equal(result.reply_id, replyId);
  });

  it('getReplyById return null when reply does not exist', async () => {
    await ctx.model.Reply.deleteOne({ _id: replyId });
    const result = await replyService.getReplyById(replyId);
    assert(result === null);
  });
});
