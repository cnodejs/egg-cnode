'use strict';

const { app, assert } = require('egg-mock/bootstrap');

function randomInt() {
  return (Math.random() * 10000).toFixed(0);
}

describe('test/app/controller/topic.test.js', () => {
  const objectId = '565c4473d0bc14ae279399fe';
  let ctx,
    topic_id,
    user_id,
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

    user_id = user._id;

    topic = await ctx.service.topic.newAndSave(
      'title',
      'content',
      'share',
      user_id
    );

    mockUser = (isAdmin = false) => {
      app.mockContext({
        user: {
          name: username,
          _id: user_id,
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
        },
      });
    };

    await ctx.service.topicCollect.newAndSave(
      user_id,
      topic_id
    );

    topic_id = topic._id;

  });

  it('should GET /topic/:tid ok', async () => {
    await app.httpRequest().get(`/topic/${topic_id}`).expect(200);
  });

  it('should GET /topic/create ok', async () => {
    mockUser();
    await app.httpRequest().get('/topic/create').expect(200);
  });

  it('should GET /topic/:tid/edit ok', async () => {
    fakeUser();
    await app.httpRequest().get(`/topic/${topic_id}/edit`).expect(403);
    mockUser();
    await app.httpRequest().get(`/topic/${objectId}/edit`).expect(404);
    await app.httpRequest().get(`/topic/${topic_id}/edit`).expect(200);
  });

  it('should POST /topic/create ok', async () => {
    mockUser();
    const body = {
      title: '这是测试标题',
      tab: 'share',
      t_content: 'hi',
    };

    await app
      .httpRequest()
      .post('/topic/create')
      .send(body)
      .expect(302);
    // console.log(result1.status);
    // assert(result1.status === 302);
    // await app.httpRequest().post('/topic/create').expect(422);
    // await app.httpRequest().post('/topic/create').expect(422);
    // await app.httpRequest().post(`/topic/${topic_id}/top`).expect(200);
  });

  it('should POST /topic/:tid/top ok', async () => {
    mockUser();
    const res = await app.httpRequest().post(`/topic/${topic_id}/top`);
    assert(res.text.includes('需要管理员权限。'));
    mockUser(true);
    await app.httpRequest().post(`/topic/${objectId}/top`).expect(404);
    await app.httpRequest().post(`/topic/${topic_id}/top`).expect(200);
  });

  it('should POST /topic/:tid/good ok', async () => {
    mockUser();
    const res = await app.httpRequest().post(`/topic/${topic_id}/good`);
    assert(res.text.includes('需要管理员权限。'));
    mockUser(true);
    await app.httpRequest().post(`/topic/${objectId}/good`).expect(404);
    await app.httpRequest().post(`/topic/${topic_id}/good`).expect(200);
  });

  it('should POST /topic/:tid/lock ok', async () => {
    mockUser();
    const res = await app.httpRequest().post(`/topic/${topic_id}/lock`);
    assert(res.text.includes('需要管理员权限。'));
    mockUser(true);
    await app.httpRequest().post(`/topic/${objectId}/lock`).expect(404);
    await app.httpRequest().post(`/topic/${topic_id}/lock`).expect(200);
  });

  it('should POST /topic/:tid/edit ok', async () => {
    const body = {
      tab: 'share',
      title: 'new title',
      t_content: 'new content',
    };

    fakeUser();
    await app
      .httpRequest()
      .post(`/topic/${topic_id}/edit`)
      .send(body)
      .expect(403);

    mockUser();
    await app
      .httpRequest()
      .post(`/topic/${objectId}/edit`)
      .send(body)
      .expect(404);
    await app
      .httpRequest()
      .post(`/topic/${topic_id}/edit`)
      .send(body)
      .expect(302);
  });

  it('should POST /topic/collect ok', async () => {
    mockUser();
    const result = await app
      .httpRequest()
      .post('/topic/collect')
      .send({
        objectId,
      });

    assert(JSON.parse(result.text).status === 'failed');

    await app
      .httpRequest()
      .post('/topic/collect')
      .send({
        topic_id,
      })
      .expect(200);
  });

  it('should POST /topic/de_collect ok', async () => {
    mockUser();
    const result = await app
      .httpRequest()
      .post('/topic/de_collect')
      .send({
        objectId,
      });
    // console.log(result.text)
    assert(JSON.parse(result.text).status === 'failed');

    await app
      .httpRequest()
      .post('/topic/de_collect')
      .send({
        topic_id,
      })
      .expect(200);
  });

  it('should POST /topic/:tid/delete ok', async () => {
    fakeUser();
    await app.httpRequest().post(`/topic/${topic_id}/delete`).expect(403);
    mockUser();
    await app.httpRequest().post(`/topic/${topic_id}/delete`).expect(200);
    await app.httpRequest().post(`/topic/${objectId}/delete`).expect(422);
  });
});
