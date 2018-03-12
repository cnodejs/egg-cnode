'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/message.test.js', () => {
  let topicId,
    loginname1,
    loginname2,
    user1,
    user2,
    ctx,
    message,
    messageService;
  before(async function() {
    ctx = app.mockContext();
    messageService = ctx.service.message;
    loginname1 = `loginname1_${Date.now()}`;
    loginname2 = `loginname2_${Date.now()}`;
    user1 = await ctx.service.user.newAndSave('name', loginname1, 'pass', `${loginname1}@test.com`, 'avatar_url', 'active');
    user2 = await ctx.service.user.newAndSave('name', loginname2, 'pass', `${loginname2}@test.com`, 'avatar_url', 'active');
    assert(user1.loginname === loginname1);
    assert(user2.loginname === loginname2);

    const title = 'first post';
    const content = 'hello world';
    const tab = 'share';
    const topic = await ctx.service.topic.newAndSave(title, content, tab, user1._id);
    topicId = topic._id;
    assert(topic.title === title);
    assert(topic.content === content);
    assert(topic.tab === tab);
    assert.equal(topic.author_id, user1._id);
  });

  it('sendAtMessage should ok', async () => {
    const result = await messageService.sendAtMessage(user2._id, user1._id, topicId, 'at');
    message = result;
    assert(message.type === 'at');
    assert(message.topic_id.toString() === topicId.toString());
    assert(message.author_id === user1._id);
    assert.equal(message.master_id.toString(), user2._id);
  });

  it('getMessagesCount should ok', async () => {
    const result = await messageService.getMessagesCount(user2._id);
    assert(result >= 1);
  });

  it('getMessageRelations should ok', async () => {
    const result1 = await messageService.getMessageRelations(message);
    assert(result1.topic_id === message.topic_id);
    const mockMessage1 = await messageService.sendAtMessage(user2._id, '565c4473d0bc14ae279399fe', user1._id, 'at');
    const result2 = await messageService.getMessageRelations(mockMessage1);
    assert(result2.is_invalid === true);
    assert(result1.topic_id === message.topic_id);
    const mockMessage2 = await messageService.sendAtMessage(user2._id, topicId, user1._id, 'at1');
    const result3 = await messageService.getMessageRelations(mockMessage2);
    assert(result3.is_invalid === true);
  });

  it('getMessageById should ok', async () => {
    const result = await messageService.getMessageById(message._id);
    assert(result._id.toString() === message._id.toString());
  });

  it('getReadMessagesByUserId should ok', async () => {
    const result = await messageService.getReadMessagesByUserId(user2._id);
    assert(result.length === 0);
  });

  it('getUnreadMessagesByUserId should ok', async () => {
    const result = await messageService.getUnreadMessagesByUserId(user2._id);
    assert(result.length >= 1);
  });

  it('updateMessagesToRead should ok', async () => {
    const result1 = await messageService.updateMessagesToRead(user2._id, []);
    assert(result1 === undefined);

    const result2 = await messageService.updateMessagesToRead(user2._id, [ message ]);
    assert(result2.ok === 1);
  });

  it('updateOneMessageToRead should ok', async () => {
    const message = await messageService.sendAtMessage(user2._id, topicId, user1._id, 'at');
    const result1 = await messageService.updateOneMessageToRead();
    assert(result1 === undefined);
    const result2 = await messageService.updateOneMessageToRead(message._id);
    assert(result2.ok === 1);
  });
});
