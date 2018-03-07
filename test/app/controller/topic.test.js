'use strict';

const { app } = require('egg-mock/bootstrap');

describe('test/app/controller/topic.test.js', () => {
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
    app.mockSession({
      user: {
        name: 'xiaomuzhu',
        _id: 2018,
      },
    });
    await app.httpRequest().get('/topic/create').expect(200);
  });
});
