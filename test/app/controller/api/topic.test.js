'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/api/topic.test.js', () => {
  let user,
    topic_id,
    topic,
    replyUser;

  before(async function() {
    const ctx = app.mockContext();

    async function newAndSaveUser(loginname) {
      const email = `${loginname}@test.com`;
      return await ctx.service.user.newAndSave('name', loginname, ctx.helper.bhash('pass'), email, 'avatar_url', 'active');
    }

    user = await newAndSaveUser(`user_loginname_${Date.now()}`);

    topic = await ctx.service.topic.newAndSave(
      'title',
      'content',
      'share',
      user.id
    );

    await ctx.service.topicCollect.newAndSave(
      user.id,
      topic.id
    );

    replyUser = await newAndSaveUser(`reply_user_loginname_${Date.now()}`);

    const reply = await ctx.service.reply.newAndSave('reply', topic._id, replyUser.id);
    reply.ups.push(user.id);
    await reply.save();
  });

  it('post /api/v1/topics should ok', async () => {
    const res = await app.httpRequest()
      .post('/api/v1/topics')
      .send({
        accesstoken: user.accessToken,
        title: 'test title',
        tab: 'share',
        content: 'test content',
      })
      .expect(200);
    topic_id = res.body.topic_id;
  });

  it('post /api/v1/topics/update should ok', async () => {
    await app.httpRequest()
      .post('/api/v1/topics/update')
      .send({
        accesstoken: user.accessToken,
        topic_id,
        title: 'update title',
        tab: 'share',
        content: 'update title',
      })
      .expect(200);
  });

  it('post /api/v1/topics/update should 404', async () => {
    await app.httpRequest()
      .post('/api/v1/topics/update')
      .send({
        accesstoken: user.accessToken,
        topic_id: '012345678901234567890123',
        title: 'update title',
        tab: 'share',
        content: 'update title',
      })
      .expect(404);
  });

  it('post /api/v1/topics/update should 403', async () => {
    await app.httpRequest()
      .post('/api/v1/topics/update')
      .send({
        accesstoken: replyUser.accessToken,
        topic_id,
        title: 'update title',
        tab: 'share',
        content: 'update title',
      })
      .expect(403);
  });

  it('get /topic/:id should ok', async () => {
    const res = await app.httpRequest()
      .get('/api/v1/topic/' + topic_id)
      .expect(200);
    const data = res.body.data;
    assert(data.id === topic_id);
    assert(data.content.includes('<div class="markdown-text">'));
  });

  it('get /topic/:id markdown should ok', async () => {
    const res = await app.httpRequest()
      .get('/api/v1/topic/' + topic_id)
      .query({ mdrender: false })
      .expect(200);
    const data = res.body.data;
    assert(data.id === topic_id);
    assert(!data.content.includes('<div class="markdown-text">'));
    assert(!data.is_collect);
  });

  it('get /topic/:id with accesstoken should ok', async () => {
    const res = await app.httpRequest()
      .get('/api/v1/topic/' + topic.id)
      .query({ accesstoken: user.accessToken })
      .expect(200);
    const data = res.body.data;
    assert(data.is_collect);
    assert(data.replies[0].is_uped);
  });

  it('get /topic/:id should 404', async () => {
    await app.httpRequest()
      .get('/api/v1/topic/012345678901234567890123')
      .expect(404);
  });

  it('get /topics should ok', async () => {
    const res = await app.httpRequest()
      .get('/api/v1/topics')
      .expect(200);
    const data = res.body.data;
    assert(data.some(item => {
      return item.id === topic_id;
    }));
    assert(data.every(item => {
      return item.content.includes('<div class="markdown-text">');
    }));
  });

  it('get /topics with limit 2 should ok', async () => {
    const res = await app.httpRequest()
      .get('/api/v1/topics')
      .query({ limit: 2 })
      .expect(200);
    const data = res.body.data;
    assert(data.length === 2);
  });

  it('get /topics markdown should ok', async () => {
    const res = await app.httpRequest()
      .get('/api/v1/topics')
      .query({ mdrender: false })
      .expect(200);
    const data = res.body.data;
    assert(data.some(item => {
      return item.id === topic_id;
    }));
    assert(data.every(item => {
      return !item.content.includes('<div class="markdown-text">');
    }));
  });
});
