'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/topic.test.js', () => {
  let ctx;
  let topic;
  let topicId;
  let replyId;
  let userId;
  let loginname;
  let email;

  before(async () => {
    ctx = app.mockContext();
    topic = ctx.service.topic;
    loginname = `loginname_${Date.now()}`;
    email = `${loginname}@test.com`;
    const result = await ctx.service.user.newAndSave('name', loginname, 'pass', email, 'avatar_url', 'active');
    userId = result._id;
    assert(result.loginname === loginname);
  });

  it('newAndSave should ok', async () => {
    const title = 'first post';
    const content = 'hello world';
    const tab = 'share';
    const result = await topic.newAndSave(title, content, tab, userId);
    assert(result.title === title);
    assert(result.content === content);
    assert(result.tab === tab);
    assert.equal(result.author_id, userId);
    topicId = result._id;
    const reply = await ctx.service.reply.newAndSave('hi', topicId, userId);
    assert(reply.content === 'hi');
    assert(reply.author_id === userId);
    assert(reply.topic_id === topicId);
    replyId = reply._id;
  });

  it('updateLastReply should ok', async () => {
    const result1 = await topic.updateLastReply(topicId, replyId);
    assert(result1.last_reply.toString() === replyId.toString());
    const result2 = await topic.updateLastReply();
    assert(!result2);
  });

  it('getTopicById should ok', async () => {
    const result1 = await topic.getTopicById(topicId);
    assert.equal(result1.topic._id.toString(), topicId);
    assert.equal(result1.author._id.toString(), userId);
    assert.equal(result1.last_reply._id.toString(), replyId);
    const result2 = await topic.getTopicById();
    assert(result2.topic === null);
    assert(result2.author === null);
    assert(result2.last_reply === null);
  });

  it('getCountByQuery should ok', async () => {
    const query = {
      good: false,
    };
    const result = await topic.getCountByQuery(query);
    assert(result >= 1);
  });

  it('getTopicsByQuery should ok', async () => {
    const query1 = {
      good: false,
    };
    const result1 = await topic.getTopicsByQuery(query1, {});
    assert(result1.length >= 1);

    const query2 = {
      good: true,
    };
    const result2 = await topic.getTopicsByQuery(query2, {});
    assert(result2.length < result1.length);
  });

  it('getLimit5w should ok', async () => {
    const result = await topic.getLimit5w();
    assert(result.length >= 1);
  });

  it('getFullTopic should ok', async () => {
    const result1 = await topic.getFullTopic();
    assert(result1.length === 0);

    const result2 = await topic.getFullTopic(topicId);
    assert.equal(result2[0]._id.toString(), topicId);
    assert(result2[1].loginname === loginname);

    await ctx.model.User.deleteOne({ _id: userId }).exec();
    const result3 = await topic.getFullTopic(topicId);
    assert(result3.length === 0);
  });

  it('getTopic should ok', async () => {
    const result = await topic.getTopic(topicId);
    assert.equal(result._id.toString(), topicId);
    assert.equal(result.author_id.toString(), userId);
  });

  it('reduceCount should ok', async () => {
    const result1 = await topic.reduceCount(topicId);
    assert(result1.last_reply, replyId);
    await ctx.model.Reply.deleteOne({ _id: replyId }).exec();
    const result2 = await topic.reduceCount(topicId);
    assert(result2.last_reply === null);

    let err;
    try {
      await topic.reduceCount();
    } catch (e) {
      err = e;
      assert(e.message === '该主题不存在');
    }
    assert(err);
  });
});
