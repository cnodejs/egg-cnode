'use strict';

const Controller = require('egg').Controller;

class MessageController extends Controller {
  async count() {
    const { ctx } = this;
    const userId = ctx.request.user._id;
    const count = await ctx.service.message.getMessagesCount(userId);
    ctx.body = { count };
  }

  async markAll() {
    const { ctx } = this;
    const userId = ctx.request.user._id;
    const messages = await ctx.service.message.getUnreadMessagesByUserId(userId);
    const result = await ctx.service.message.updateMessagesToRead(userId, messages);
    ctx.body = {
      success: true,
      marked_msgs: result ? messages.map(message => { return { id: message._id }; }) : [],
    };
  }

  async markOne() {
    const { ctx } = this;
    const messageId = ctx.params.msg_id;
    await ctx.service.message.updateOneMessageToRead(messageId);

    ctx.body = {
      success: true,
      marked_msg_id: messageId,
    };
  }

  async list() {
    const { ctx } = this;
    const userId = ctx.request.user._id;
    const msgService = ctx.service.message;
    const mdrender = ctx.request.query.mdrender !== 'false';
    const messages = await Promise.all([
      msgService.getReadMessagesByUserId(userId),
      msgService.getUnreadMessagesByUserId(userId),
    ]);

    let hasReadMessages = await Promise.all(messages[0].map(async message => await msgService.getMessageRelations(message)));
    let hasUnReadMessages = await Promise.all(messages[1].map(async message => await msgService.getMessageRelations(message)));

    const formatMessage = message => {
      return {
        id: message._id,
        type: message.type,
        has_read: message.has_read,
        create_at: message.create_at,
        author: {
          loginname: message.author.loginname,
          avatar_url: message.author.avatar_url,
        },
        topic: {
          id: message.topic.topic._id,
          title: message.topic.topic.title,
          last_reply_at: message.topic.topic.last_reply_at,
        },
        reply: message.reply ? {
          content: mdrender ? ctx.helper.markdown(message.reply.content) : message.reply.content,
        } : {},
      };
    };

    hasReadMessages = hasReadMessages.map(message => formatMessage(message));
    hasUnReadMessages = hasUnReadMessages.map(message => formatMessage(message));

    ctx.body = {
      success: true,
      data: {
        has_read_messages: hasReadMessages,
        hasnot_read_messages: hasUnReadMessages,
      },
    };
  }
}

module.exports = MessageController;
