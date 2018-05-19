'use strict';

const { app, assert } = require('egg-mock/bootstrap');

async function createUser(name) {
  const ctx = app.mockContext();
  const loginname = `${name}_${Date.now()}`;
  return await ctx.service.user.newAndSave(name, loginname, 'pass', `${loginname}@test.com`, 'avatar_url', 'active');
}

describe('test/app/controller/api/reply.test.js', () => {
  let user1;
  let user2;
  let author;
  let topic;

  before(async () => {
    author = await createUser('author_name');
    user1 = await createUser('user1');
    user2 = await createUser('user2');
  });

  beforeEach(async () => {
    const ctx = app.mockContext();

    const title = 'reply test topic';
    const content = 'reply test topic';
    const tab = 'share';

    topic = await ctx.service.topic.newAndSave(title, content, tab, author.id);

    assert(topic.title === title);
    assert(topic.content === content);
    assert(topic.tab === tab);
    assert.equal(topic.author_id, author.id);
  });

  describe('/api/v1/topic/:topic_id/replies', () => {

    async function checkMessage(type, senderId, receiverId, replyId, revert = false) {
      const ctx = app.mockContext();

      const messages = await ctx.service.message.getUnreadMessagesByUserId(receiverId);
      let valid = false;
      for (const message of messages) {
        if (
          message.type === type &&
          message.master_id.toString() === receiverId &&
          message.topic_id.toString() === topic.id &&
          message.reply_id.toString() === replyId &&
          message.author_id.toString() === senderId
        ) {
          valid = true;
        }
      }

      assert(valid === !revert, `Cannot found "${type}" type message`);
    }

    it('post should ok', async () => {
      const resp = await app.httpRequest()
        .post(`/api/v1/topic/${topic.id}/replies`)
        .send({
          content: 'test normal reply',
          accesstoken: user1.accessToken,
        })
        .expect(200);

      await checkMessage('reply', user1.id, author.id, resp.body.reply_id);
    });

    it('post should 404 when topic is not found', async () => {
      const { body } = await app.httpRequest()
        .post('/api/v1/topic/012345678901234567890123/replies')
        .send({
          content: 'no content',
          accesstoken: user1.accessToken,
        })
        .expect(404);

      assert.deepEqual(body, {
        success: false,
        error_msg: '话题不存在',
      });
    });

    it('post should 403 when topic is locked', async () => {
      topic.lock = true;
      await topic.save();
      const { body } = await app.httpRequest()
        .post(`/api/v1/topic/${topic.id}/replies`)
        .send({
          accesstoken: user1.accessToken,
          content: 'no content',
        })
        .expect(403);

      assert.deepEqual(body, {
        success: false,
        error_msg: '该话题已被锁定',
      });
    });

    it('post should ok with reply_id', async () => {
      const resp1 = await app.httpRequest()
        .post(`/api/v1/topic/${topic.id}/replies`)
        .send({
          accesstoken: user1.accessToken,
          content: 'test reply',
        })
        .expect(200);

      const replyId = resp1.body.reply_id;
      await app.httpRequest()
        .post(`/api/v1/topic/${topic.id}/replies`)
        .send({
          accesstoken: user2.accessToken,
          content: 'test reply with reply_id',
          reply_id: replyId,
        })
        .expect(200);
    });

    it('post should ok with at someone', async () => {
      await app.httpRequest()
        .post(`/api/v1/topic/${topic.id}/replies`)
        .send({
          accesstoken: user1.accessToken,
          content: 'test reply',
        })
        .expect(200);

      const resp = await app.httpRequest()
        .post(`/api/v1/topic/${topic.id}/replies`)
        .send({
          accesstoken: user2.accessToken,
          content: `@${user1.loginname} reply`,
        })
        .expect(200);

      const replyId = resp.body.reply_id;

      await checkMessage('at', user2.id, user1.id, replyId);
    });

    it('post should ok when at author only send reply message', async () => {
      // 如果一个人评论的时候 at 了作者，那么作者只会收到评论的通知，而不会再收到 at 通知
      const resp = await app.httpRequest()
        .post(`/api/v1/topic/${topic.id}/replies`)
        .send({
          accesstoken: user1.accessToken,
          content: `@${author.loginname} reply`,
        })
        .expect(200);

      await checkMessage('reply', user1.id, author.id, resp.body.reply_id);
      await checkMessage('at', user1.id, author.id, resp.body.reply_id, true);
    });

    it('post should ok when author reply self topic do not send message', async () => {
      // 如果作者回复了自己的主题，那么不发送消息
      const resp = await app.httpRequest()
        .post(`/api/v1/topic/${topic.id}/replies`)
        .send({
          accesstoken: author.accessToken,
          content: 'reply myself',
        })
        .expect(200);

      await checkMessage('reply', author.id, author.id, resp.body.reply_id, true);
    });
  });

  describe('/api/v1/reply/:reply_id/ups', async () => {
    async function postReply() {
      const { body } = await app.httpRequest()
        .post(`/api/v1/topic/${topic.id}/replies`)
        .send({
          accesstoken: user1.accessToken,
          content: 'reply',
        })
        .expect(200);

      return body.reply_id;
    }

    async function checkReplyUps(replyId, userId, status) {
      const ctx = app.mockContext();
      const reply = await ctx.service.reply.getReplyById(replyId);
      const ups = reply.ups;
      assert((ups.indexOf(userId) !== -1) === status);
    }

    it('post should ok when up reply', async () => {
      const replyId = await postReply();

      await checkReplyUps(replyId, user2.id, false);

      await app.httpRequest()
        .post(`/api/v1/reply/${replyId}/ups`)
        .send({
          accesstoken: user2.accessToken,
        })
        .expect(200);

      await checkReplyUps(replyId, user2.id, true);
    });

    it('post should ok when de-up reply', async () => {
      const replyId = await postReply();

      await checkReplyUps(replyId, user2.id, false);

      await app.httpRequest()
        .post(`/api/v1/reply/${replyId}/ups`)
        .send({
          accesstoken: user2.accessToken,
        })
        .expect(200);

      await checkReplyUps(replyId, user2.id, true);

      await app.httpRequest()
        .post(`/api/v1/reply/${replyId}/ups`)
        .send({
          accesstoken: user2.accessToken,
        })
        .expect(200);

      await checkReplyUps(replyId, user2.id, false);
    });

    it('post should 401 when no accesstoken', async () => {
      const replyId = await postReply();

      await app.httpRequest()
        .post(`/api/v1/reply/${replyId}/ups`)
        .send({})
        .expect(401);
    });

    it('post should 404 when reply is not found', async () => {
      await app.httpRequest()
        .post('/api/v1/reply/012345678901234567890123/ups')
        .send({
          accesstoken: user2.accessToken,
        })
        .expect(404);
    });

    it('post should 403 when you ups your reply', async () => {
      const replyId = await postReply();
      await app.httpRequest()
        .post(`/api/v1/reply/${replyId}/ups`)
        .send({
          accesstoken: user1.accessToken,
        })
        .expect(403);
    });
  });
});
