'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/search.test.js', () => {
  const keyword = `keyword_${Date.now()}`;
  const page = 1;
  let ctx;

  before(async function() {
    ctx = app.mockContext();
    const loginname = keyword;
    const email = `${loginname}@test.com`;
    const user = await ctx.service.user.newAndSave(loginname, loginname, 'pass', email, 'avatar_url', 'active');
    assert(user.loginname === loginname);
    const userId = user._id;
    const title = keyword;
    const content = 'hello world';
    const tab = 'share';
    const topic = await ctx.service.topic.newAndSave(title, content, tab, userId);
    assert(topic.title === title);
    assert(topic.content === content);
    assert(topic.tab === tab);
    assert(topic.author_id === userId);
  });

  it('searchUser should ok', async () => {
    const [ data, count ] = await ctx.service.search.searchUser(keyword, page);
    assert(data[0].loginname === keyword);
    assert(count === 1);
  });

  it('searchTopic should ok', async () => {
    const [ data, count ] = await ctx.service.search.searchTopic(keyword, page);
    assert(data[0].title === keyword);
    assert(count === 1);
  });

  it('searchUserAndTopic should ok', async () => {
    const [ user, topic ] = await ctx.service.search.searchUserAndTopic(keyword, page);
    assert(user.length === 1);
    assert(user[0].name === keyword);
    assert(topic.length === 1);
    assert(topic[0].title === keyword);
  });
});
