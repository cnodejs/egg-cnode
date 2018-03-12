'use strict';

const { app } = require('egg-mock/bootstrap');

describe('test/app/controller/search.test.js', () => {
  it('search should ok', async () => {
    await app.httpRequest().get('/search').expect(302);
  });
});
