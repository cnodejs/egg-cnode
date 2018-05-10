'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/reply.test.js', () => {
  let topic,
    user,
    reply;
  before(async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const loginname = `loginname_${Date.now()}`;
    const email = `${loginname}@test.com`;
    const result = await ctx.service.user.newAndSave('name',
      loginname, 'pass', email, 'avatar_url', 'active');
    assert(result.loginname === loginname);

    user = result;

    const topic_title = 'test';
    const topic_content = 'unit test';
    const tab = 'share';
    topic = await ctx.service.topic.newAndSave(topic_title, topic_content, tab, user._id);

    assert(topic.title === topic_title);
    assert(topic.content === topic_content);
    assert(topic.tab === tab);

    const reply_content = 'unit test reply';
    reply = await ctx.service.reply.newAndSave(reply_content, topic._id, user._id);

    assert(reply.content === reply_content);
  });

  it('getReply should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const test_reply = await ctx.service.reply.getReply(reply._id);
    assert(test_reply.content === reply.content);
  });

  it('getReplyById should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    let test_reply = await ctx.service.reply.getReplyById(reply._id);
    assert(test_reply.content === reply.content);

    test_reply = await ctx.service.reply.getReplyById();
    assert(test_reply === null);

    test_reply = await ctx.service.reply.getReplyById('');
    assert(test_reply === null);

    test_reply = await ctx.service.reply.getReplyById('565c4473d0bc14ae279399fe');
    assert(test_reply === null);
  });

  it('getRepliesByTopicId should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    let replies = await ctx.service.reply.getRepliesByTopicId(topic._id);
    assert(replies.length === 1);
    assert(replies[0].content === reply.content);

    replies = await ctx.service.reply.getRepliesByTopicId();
    assert(replies.length === 0);

    replies = await ctx.service.reply.getRepliesByTopicId('565c4473d0bc14ae279399fe');
    assert(replies.length === 0);
  });

  it('newAndSave should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const topic_title = 'test1';
    const topic_content = 'unit test1';
    const tab = 'share';
    const test_topic = await ctx.service.topic.newAndSave(topic_title, topic_content, tab, user._id);

    assert(test_topic.title === topic_title);

    const reply_content = 'unit test reply';
    const test_reply1 = await ctx.service.reply.newAndSave(reply_content, test_topic._id, user._id);
    const test_reply2 = await ctx.service.reply.newAndSave(reply_content, test_topic._id, user._id, reply._id);
    assert(test_reply1.content === reply_content);
    assert(test_reply2.reply_id.toString() === reply._id.toString());
  });

  it('getLastReplyByTopId should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const last_reply = await ctx.service.reply.getLastReplyByTopId(topic._id);

    assert(last_reply._id.toString() === reply._id.toString());
  });

  it('getRepliesByAuthorId should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const test_replies = await ctx.service.reply.getRepliesByAuthorId(user._id);
    assert(test_replies[1].content === reply.content);
  });

  it('getCountByAuthorId should ok', async function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const count = await ctx.service.reply.getCountByAuthorId(user._id);
    assert(count >= 1);
  });

});
