'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/topic.test.js', () => {
  it('should GET /topic/:tid ok', async () => {
    await app.httpRequest()
      .get('/topic/:tid')
      .expect(404);
  });
});
