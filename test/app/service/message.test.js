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
    message = await messageService.sendAtMessage(user2._id, user1._id, topicId);
    assert(message.type === 'at');
    assert(message.topic_id.toString() === topicId.toString());
    assert(message.author_id === user1._id);
    assert.equal(message.master_id.toString(), user2._id);
  });

  it('sendReplyMessage should ok', async () => {
    const result = await messageService.sendReplyMessage(user2._id, user1._id, topicId);
    assert(result.type === 'reply');
    assert(result.topic_id.toString() === topicId.toString());
    assert(result.author_id === user1._id);
    assert.equal(result.master_id.toString(), user2._id);
  });

  it('getMessagesCount should ok', async () => {
    const result = await messageService.getMessagesCount(user2._id);
    assert(result >= 1);
  });

  it('getMessageRelations should ok', async () => {
    let result = await messageService.getMessageRelations(message);
    assert(result.topic.topic._id.toString() === message.topic_id.toString());

    const mockMessage1 = await messageService.sendAtMessage(user2._id, '565c4473d0bc14ae279399fe', user1._id);
    result = await messageService.getMessageRelations(mockMessage1);
    assert(result.is_invalid === true);

    message.type = 'at1';
    result = await messageService.getMessageRelations(message);
    assert(result.is_invalid === true);
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
    let result = await messageService.updateMessagesToRead(user2._id, []);
    assert(result === undefined);

    result = await messageService.updateMessagesToRead(user2._id, [ message ]);
    assert(result.ok === 1);
  });

  it('updateOneMessageToRead should ok', async () => {
    const message = await messageService.sendAtMessage(user2._id, topicId, user1._id);
    let result = await messageService.updateOneMessageToRead();
    assert(result === undefined);
    result = await messageService.updateOneMessageToRead(message._id);
    assert(result.ok === 1);
  });
});
