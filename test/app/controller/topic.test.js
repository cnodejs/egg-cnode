'use strict';

const { app, assert } = require('egg-mock/bootstrap');

function randomInt() {
  return (Math.random() * 10000).toFixed(0);
}

describe('test/app/controller/topic.test.js', () => {
  let ctx,
    topic_id,
    user_id,
    key,
    username,
    user,
    admin,
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

    await ctx.service.topicCollect.newAndSave(
      user_id,
      topic_id
    );
    topic_id = topic._id;

    admin = Object.assign(user, { is_admin: true });
  });

  it('should GET /topic/:tid ok', async () => {
    await app.httpRequest().get('/topic/:tid').expect(404);
  });

  it('should GET /topic/edit ok', async () => {
    await app.httpRequest().get('/topic/edit').expect(404);
  });

  it('should GET /topic/create forbidden', async () => {
    await app.httpRequest().get('/topic/create').expect(403);
  });

  it('should GET /topic/create ok', async () => {
    app.mockUser({
      name: username,
      _id: user_id,
      is_admin: true,
    });
    const res = await app.httpRequest().get('/topic/create');
    assert(res.status === 200);
  });

  it('should POST /topic/:tid/top ok', async () => {
    app.mockUser({
      name: username,
      _id: user_id,
      is_admin: true,
    });
    app.mockCsrf();
    await app.httpRequest().post(`/topic/${topic_id}/top`).expect(200);
  });

  it('should POST /topic/:tid/good ok', async () => {
    app.mockUser({
      name: username,
      _id: user_id,
      is_admin: true,
    });
    app.mockCsrf();
    await app.httpRequest().post(`/topic/${topic_id}/good`).expect(200);
  });

  it('should GET /topic/:tid/edit ok', async () => {
    app.mockUser({
      name: username,
      _id: user_id,
      is_admin: true,
    });

    const res = await app.httpRequest().get(`/topic/${topic_id}/edit`);
    assert(res.status === 200);
  });

  it('should GET /topic/:tid/edit ok', async () => {
    app.mockSession({
      user: {
        name: 'other',
        _id: '123',
      },
    });

    await app.httpRequest().get(`/topic/${topic_id}/edit`).expect(403);
  });

  it('should POST /topic/:tid/lock ok', async () => {
    app.mockSession({
      user: {
        name: username,
        _id: user_id,
        is_admin: true,
      },
    });
    app.mockCsrf();
    await app.httpRequest().post(`/topic/${topic_id}/lock`).expect(200);
  });


  it('should POST /topic/:tid/delete ok', async () => {
    app.mockUser({
      name: username,
      _id: user_id,
      is_admin: true,
    });
    app.mockCsrf();
    await app.httpRequest().post(`/topic/${topic_id}/delete`).expect(200);
  });

  it('should POST /topic/:tid/edit ok', async () => {
    app.mockUser({
      name: username,
      _id: user_id,
      is_admin: true,
    });
    app.mockCsrf();
    await app
      .httpRequest()
      .post(`/topic/${topic_id}/edit`)
      .send({
        tab: 'share',
        title: 'new title',
        t_content: 'new content',
      })
      .expect(302);
  });

  it('should POST /topic/collect ok', async () => {
    app.mockContext({ user });
    app.mockSession({ user: admin });
    app.mockCsrf();
    await app
      .httpRequest()
      .post('/topic/collect')
      .send({
        topic_id,
      })
      .expect(200);
  });

  // 测试报错,正在排查:Cannot read property 'getTopicCollect' of undefined
  // it('should POST /topic/collect ok', async () => {
  //   app.mockSession({
  //     user: {
  //       name: username,
  //       _id: user_id,
  //       is_admin: true,
  //     },
  //   });
  //   app.mockCsrf();
  //   await app
  //     .httpRequest()
  //     .post('/topic/collect')
  //     .send({
  //       topic_id,
  //     })
  //     .set('Content-Type', 'application/json')
  //     .set('Accept', 'application/json')
  //     .expect(200);
  // });
});
