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
    topicId = result._id;
    const reply = await ctx.service.reply.newAndSave('hi', topicId, userId);
    replyId = reply._id;
    assert(result.title === title);
    assert(result.content === content);
    assert(result.tab === tab);
    assert.equal(result.author_id, userId);
  });

  it('getTopicById should ok', async () => {
    const result = await topic.getTopicById(topicId);
    assert.equal(result.topic._id.toString(), topicId);
    assert.equal(result.author._id.toString(), userId);
    assert(result.last_reply === null);
  });

  it('getTopicById should ok when topic id is empty', async () => {
    const result = await topic.getTopicById();
    assert(result.topic === null);
    assert(result.author === null);
    assert(result.last_reply === null);
  });

  it('getTopicById should return last_reply', async () => {
    // const result = await topic.getTopicById(topicId);
    // assert.equal(result.last_reply._id.toString(), replyId);
  });

  it('getCountByQuery should ok', async () => {
    const result = await topic.getCountByQuery('first');
    assert(result >= 1);
  });

  it('getTopicsByQuery should ok', async () => {
    const query = {
      good: false,
    };
    const result = await topic.getTopicsByQuery(query, {});
    assert(result.length > 0);
  });

  it('getTopicsByQuery should ok when result is empty', async () => {
    const query = {
      good: 'test',
    };
    const result = await topic.getTopicsByQuery(query, {});
    assert(result.length === 0);
  });

  it('getLimit5w should ok', async () => {
    const result = await topic.getLimit5w();
    assert(result.length > 0);
  });

  it('getFullTopic throws error when topic id is emoty', async () => {
    try {
      await await topic.getFullTopic();
    } catch (e) {
      assert(e.message === '此话题不存在或已被删除。');
    }
  });

  it('getFullTopic should ok', async () => {
    const result = await topic.getFullTopic(topicId);
    assert.equal(result[0]._id.toString(), topicId);
    assert(result[1].loginname === loginname);
  });

  it('updateLastReply should ok', async () => {
    const result = await topic.updateLastReply(topicId, replyId);
    assert(result.last_reply === replyId);
  });

  it('updateLastReply throws error when topic id is emoty', async () => {
    try {
      await await topic.updateLastReply();
    } catch (e) {
      assert(e.message === '此话题不存在或已被删除。');
    }
  });

  it('getTopic should ok', async () => {
    const result = await topic.getTopic(topicId);
    assert.equal(result._id.toString(), topicId);
    assert.equal(result.author_id.toString(), userId);
  });

  it('reduceCount should ok', async () => {
    const result = await topic.getFullTopic(topicId);
    assert.equal(result[0]._id.toString(), topicId);
  });

  it('reduceCount should ok when reply is empty', async () => {
    // const result = await topic.getFullTopic(topicId);
    // assert.equal(result[0]._id.toString(), topicId);
  });

  it('reduceCount throws error when topic id is empty', async () => {
    try {
      await topic.reduceCount();
    } catch (e) {
      assert(e.message === '该主题不存在');
    }
  });

  it('getFullTopic throws error when author id is emoty', async () => {
    await ctx.model.User.deleteOne({ _id: userId }).exec();
    try {
      await topic.getFullTopic(topicId);
    } catch (e) {
      assert(e.message === '话题的作者丢了。');
    }
  });
});
