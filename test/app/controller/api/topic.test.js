'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/api/topic.test.js', () => {
  let user,
    topic_id;

  before(async function() {
    const ctx = app.mockContext();
    const loginname = `user_loginname_${Date.now()}`;
    const email = `${loginname}@test.com`;
    user = await ctx.service.user.newAndSave('name', loginname, ctx.helper.bhash('pass'), email, 'avatar_url', 'active');
    assert(user.loginname === loginname);
  });

  it('post /api/v1/topics should ok', async function() {
    await app.httpRequest()
      .post('/api/v1/topics')
      .send({
        accesstoken: user.accessToken,
        title: 'test title',
        tab: 'share',
        content: 'test content',
      })
      .expect(200)
      .then(res => {
        topic_id = res.body.topic_id;
      });
  });

  it('post /api/v1/topics/update should ok', async function() {
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

  it('get /topic/:id should ok', async function() {
    await app.httpRequest()
      .get('/api/v1/topic/' + topic_id)
      .query({ accesstoken: user.accessToken })
      .expect(200)
      .then(res => {
        const data = res.body.data;
        assert(data.id === topic_id);
        assert(data.content.includes('<div class="markdown-text">'));
      });
  });

  it('get /topics should ok', async function() {
    await app.httpRequest()
      .get('/api/v1/topics')
      .query({ accesstoken: user.accessToken })
      .expect(200)
      .then(res => {
        const data = res.body.data;
        assert(data.some(item => {
          return item.id === topic_id;
        }));
        assert(data.every(item => {
          return item.content.includes('<div class="markdown-text">');
        }));
      });
  });

  it('get /topics markdown should ok', async function() {
    await app.httpRequest()
      .get('/api/v1/topics')
      .query({ mdrender: false })
      .expect(200)
      .then(res => {
        const data = res.body.data;
        assert(data.some(item => {
          return item.id === topic_id;
        }));
        assert(data.every(item => {
          return !item.content.includes('<div class="markdown-text">');
        }));
      });
  });
});
