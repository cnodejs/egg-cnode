'use strict';

const { app, assert } = require('egg-mock/bootstrap');
const path = require('path');

function randomInt() {
  return (Math.random() * 10000).toFixed(0);
}

describe('test/app/controller/topic.test.js', () => {
  const objectId = '565c4473d0bc14ae279399fe';
  let ctx,
    topicId,
    userId,
    key,
    username,
    user,
    mockUser,
    fakeUser,
    topic;

  before(async () => {
    ctx = app.mockContext();
    username = 'xiaomuzhu';
    key = new Date().getTime() + '_' + randomInt();
    user = await ctx.service.user.newAndSave(
      username,
      username + key,
      'pass',
      username + key + '@test.com',
      'avatar_url',
      'active'
    );

    userId = user._id;

    topic = await ctx.service.topic.newAndSave(
      'title',
      'content',
      'share',
      userId
    );

    mockUser = (isAdmin = false) => {
      app.mockContext({
        user: {
          name: username,
          _id: userId,
          is_admin: isAdmin,
        },
      });
      app.mockCsrf();
    };

    fakeUser = () => {
      app.mockContext({
        user: {
          name: 'cnode',
          _id: objectId,
          is_admin: false,
        },
      });
      app.mockCsrf();
    };

    await ctx.service.topicCollect.newAndSave(
      userId,
      topicId
    );

    topicId = topic._id;
    await ctx.service.reply.newAndSave('hi', topicId, userId);
  });

  it('should GET /topic/:tid ok', async () => {
    await app.httpRequest().get(`/topic/${topicId}`).expect(200);
    await app.httpRequest().get('/topic/123').expect(404);
    mockUser();
    ctx.service.cache.setex('no_reply_topics', null, 60);
    await app.httpRequest().get(`/topic/${topicId}`).expect(200);
  });

  it('should GET /topic/create ok', async () => {
    mockUser();
    await app.httpRequest().get('/topic/create').expect(200);
  });

  it('should GET /topic/:tid/edit ok', async () => {
    fakeUser();
    await app.httpRequest().get(`/topic/${topicId}/edit`).expect(403);
    mockUser();
    await app.httpRequest().get(`/topic/${objectId}/edit`).expect(404);
    await app.httpRequest().get(`/topic/${topicId}/edit`).expect(200);
  });

  it('should POST /topic/create forbidden', async () => {
    app.mockCsrf();
    await app.httpRequest().post('/topic/create').expect(403);
  });

  it('should POST /topic/create forbidden', async () => {
    mockUser();
    app.mockCsrf();
    await app.httpRequest().post('/topic/create')
      .send({
        invalid_field: 'not make sense',
      })
      .expect(422);
  });

  it('should POST /topic/create ok', async () => {
    mockUser();
    app.mockCsrf();
    await app.httpRequest().post('/topic/create')
      .send({
        tab: 'share',
        title: 'topic测试标题',
        content: 'topic test topic content',
      })
      .expect(302);
  });

  it('should POST /topic/create per day limit works', async () => {
    mockUser();
    app.mockCsrf();
    for (let i = 0; i < 9; i++) {
      await app.httpRequest().post('/topic/create')
        .send({
          tab: 'share',
          title: `topic测试标题${i + 1}`,
          content: 'topic test topic content',
        })
        .expect(302);
    }
    await app.httpRequest().post('/topic/create')
      .send({
        tab: 'share',
        title: 'topic测试标题11',
        content: 'topic test topic content',
      })
      .expect(403);
  });

  it('should POST /topic/:tid/top ok', async () => {
    mockUser();
    const res = await app.httpRequest().post(`/topic/${topicId}/top`);
    assert(res.text.includes('需要管理员权限。'));
    mockUser(true);
    await app.httpRequest().post(`/topic/${objectId}/top`).expect(404);
    await app.httpRequest().post(`/topic/${topicId}/top`).expect(200);
  });

  it('should POST /topic/:tid/good ok', async () => {
    mockUser();
    const res = await app.httpRequest().post(`/topic/${topicId}/good`);
    assert(res.text.includes('需要管理员权限。'));
    mockUser(true);
    await app.httpRequest().post(`/topic/${objectId}/good`).expect(404);
    await app.httpRequest().post(`/topic/${topicId}/good`).expect(200);
  });

  it('should POST /topic/:tid/lock ok', async () => {
    mockUser();
    const res = await app.httpRequest().post(`/topic/${topicId}/lock`);
    assert(res.text.includes('需要管理员权限。'));
    mockUser(true);
    await app.httpRequest().post(`/topic/${objectId}/lock`).expect(404);
    await app.httpRequest().post(`/topic/${topicId}/lock`).expect(200);
  });

  it('should POST /topic/:tid/edit ok', async () => {
    const body = {
      title: '',
      tab: '',
      content: '',
    };

    fakeUser();
    await app
      .httpRequest()
      .post(`/topic/${topicId}/edit`)
      .send(body)
      .expect(403);

    mockUser();
    await app
      .httpRequest()
      .post(`/topic/${objectId}/edit`)
      .send(body)
      .expect(404);

    const r1 = await app
      .httpRequest()
      .post(`/topic/${topicId}/edit`)
      .send(body);
    assert(r1.text.includes('标题不能是空的。'));

    body.title = 'hi';
    const r2 = await app
      .httpRequest()
      .post(`/topic/${topicId}/edit`)
      .send(body);
    assert(r2.text.includes('标题字数太多或太少。'));

    body.title = '这是一个大标题';
    const r4 = await app
      .httpRequest()
      .post(`/topic/${topicId}/edit`)
      .send(body);
    assert(r4.text.includes('必须选择一个版块。'));

    body.tab = 'share';
    const r3 = await app
      .httpRequest()
      .post(`/topic/${topicId}/edit`)
      .send(body);
    assert(r3.text.includes('内容不可为空。'));

    body.content = 'hi';
    await app
      .httpRequest()
      .post(`/topic/${topicId}/edit`)
      .send(body)
      .expect(302);
  });

  it('should POST /topic/collect ok', async () => {
    mockUser();
    const result1 = await app
      .httpRequest()
      .post('/topic/collect')
      .send({
        topic_id: objectId,
      });

    assert(JSON.parse(result1.text).status === 'failed');

    await app
      .httpRequest()
      .post('/topic/collect')
      .send({
        topic_id: topicId,
      })
      .expect(200);

    const result2 = await app
      .httpRequest()
      .post('/topic/collect')
      .send({
        topic_id: topicId,
      });

    assert(JSON.parse(result2.text).status === 'failed');
  });

  it('should POST /topic/de_collect ok', async () => {
    fakeUser();
    const result1 = await app
      .httpRequest()
      .post('/topic/de_collect')
      .send({
        topic_id: topicId,
      });
    assert(JSON.parse(result1.text).status === 'failed');

    mockUser();
    const result2 = await app
      .httpRequest()
      .post('/topic/de_collect')
      .send({
        topic_id: objectId,
      });
    assert(JSON.parse(result2.text).status === 'failed');

    await app
      .httpRequest()
      .post('/topic/de_collect')
      .send({
        topic_id: topicId,
      })
      .expect(200);
  });

  it('should POST /topic/:tid/delete ok', async () => {
    fakeUser();
    await app.httpRequest().post(`/topic/${topicId}/delete`).expect(403);
    mockUser();
    await app.httpRequest().post(`/topic/${topicId}/delete`).expect(200);
    await app.httpRequest().post(`/topic/${objectId}/delete`).expect(422);
  });

  it('should POST /upload ok', async () => {
    const file = path.resolve(__dirname, '../../../app/public/images/logo.png');
    mockUser();
    await app
      .httpRequest()
      .post('/upload')
      .attach('logo', file)
      .expect(200);
  });

  it('should POST /upload forbidden', async () => {
    const file = path.resolve(__dirname, '../../../app/public/images/logo.png');
    await app
      .httpRequest()
      .post('/upload')
      .attach('logo', file)
      .expect(403);
  });
});
