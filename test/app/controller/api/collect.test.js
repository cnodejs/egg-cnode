'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/api/collect.test.js', () => {
  let user,
    topic_id;

  before(async function() {
    const ctx = app.mockContext();
    const loginname = `user_loginname_${Date.now()}`;
    const email = `${loginname}@test.com`;
    user = await ctx.service.user.newAndSave('name', loginname, ctx.helper.bhash('pass'), email, 'avatar_url', 'active');
    const title = 'test topic';
    const content = 'test topic';
    const tab = 'share';

    const topic = await ctx.service.topic.newAndSave(title, content, tab, user.id);
    topic_id = topic._id.toString();
  });

  it('post /topic_collect/collect should ok', async () => {
    await app.httpRequest()
      .post('/api/v1/topic_collect/collect')
      .send({
        accesstoken: user.accessToken,
        topic_id,
      })
      .expect(200);
    await app.httpRequest()
      .post('/api/v1/topic_collect/collect')
      .send({
        accesstoken: user.accessToken,
        topic_id: '5aaa4432f472129d5e4d6773',
      })
      .expect(404);
    await app.httpRequest()
      .post('/api/v1/topic_collect/collect')
      .send({
        accesstoken: user.accessToken,
        topic_id: '123',
      })
      .expect(422);
    const result = await app.httpRequest()
      .post('/api/v1/topic_collect/collect')
      .send({
        accesstoken: user.accessToken,
        topic_id,
      });
    assert(result.body.error_msg === '已经收藏过该主题');
  });

  it('get /topic_collect/:loginname should ok', async () => {
    const loginname = user.loginname;
    await app.httpRequest().get(`/api/v1/topic_collect/${loginname}`).expect(200);
    await app.httpRequest().get(`/api/v1/topic_collect/${loginname}test`).expect(404);
  });

  it('post /topic_collect/de_collect should ok', async () => {
    await app.httpRequest()
      .post('/api/v1/topic_collect/de_collect')
      .send({
        accesstoken: user.accessToken,
        topic_id: '123',
      })
      .expect(422);
    await app.httpRequest()
      .post('/api/v1/topic_collect/de_collect')
      .send({
        accesstoken: user.accessToken,
        topic_id: '5aaa4432f472129d5e4d6773',
      })
      .expect(404);
    await app.httpRequest()
      .post('/api/v1/topic_collect/de_collect')
      .send({
        accesstoken: user.accessToken,
        topic_id,
      })
      .expect(200);
  });
});
