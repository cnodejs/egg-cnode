'use strict';

const Controller = require('egg').Controller;

class MessageController extends Controller {
  async index() {
    const { ctx } = this;
    const userId = ctx.user._id;
    const readMessageResults = await ctx.service.message.getReadMessagesByUserId(userId);
    const unReadMessageResults = await ctx.service.message.getUnreadMessagesByUserId(userId);
    const hasReadMessages = await Promise.all(readMessageResults.map(async message => await ctx.service.message.getMessageRelations(message)));
    const hasUnReadMessages = await Promise.all(unReadMessageResults.map(async message => await ctx.service.message.getMessageRelations(message)));

    // 把未读消息全部设置成已读
    await ctx.service.message.updateMessagesToRead(userId, unReadMessageResults);
    await ctx.render('message/index.html', { has_read_messages: hasReadMessages, hasnot_read_messages: hasUnReadMessages });
  }
}

module.exports = MessageController;
