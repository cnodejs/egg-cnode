'use strict';

const Controller = require('egg').Controller;

const MongoObjectIdSchema = {
  type: 'string',
  format: /^[0-9a-f]{24}$/i,
};

class ReplyController extends Controller {
  async create() {
    const { ctx } = this;
    ctx.validate({
      topic_id: MongoObjectIdSchema,
    }, ctx.params);

    const topicId = ctx.params.topic_id;
    const content = (ctx.request.body.content || '').trim();
    const replyId = ctx.request.body.reply_id || null;

    if (content === '') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error_msg: '回复内容不能为空',
      };
      return;
    }

    const { topic, author } = await ctx.service.topic.getTopicById(topicId);

    if (!topic) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error_msg: '话题不存在',
      };
      return;
    }

    if (topic.lock) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error_msg: '该话题已被锁定',
      };
      return;
    }

    const reply = await ctx.service.reply.newAndSave(content, topicId, ctx.request.user.id, replyId);
    await ctx.service.topic.updateLastReply(topicId, reply._id);
    // 发送 at 消息，并防止重复 at 作者
    const newContent = content.replace('@' + author.loginname + ' ', '');
    await ctx.service.at.sendMessageToMentionUsers(newContent, topicId, ctx.request.user.id, reply._id);

    const user = await ctx.service.user.getUserById(ctx.request.user.id);
    user.score += 5;
    user.reply_count += 1;
    await user.save();

    if (topic.author_id.toString() !== ctx.request.user.id.toString()) {
      await ctx.service.message.sendReplyMessage(topic.author_id, ctx.request.user.id, topic._id, reply._id);
    }

    ctx.body = {
      success: true,
      reply_id: reply._id,
    };
  }

  async updateUps() {
    const { ctx } = this;
    ctx.validate({
      reply_id: MongoObjectIdSchema,
    }, ctx.params);

    const replyId = ctx.params.reply_id;
    const userId = ctx.request.user.id;

    const reply = await ctx.service.reply.getReplyById(replyId);

    if (!reply) {
      ctx.status = 404;
      ctx.body = { success: false, error_msg: '评论不存在' };
      return;
    }

    if (reply.author_id.equals(userId)) {
      ctx.status = 403;
      ctx.body = { success: false, error_msg: '不能帮自己点赞' };
      return;
    }

    let action = '';
    reply.ups = (reply.ups || []);
    const ups = reply.ups;
    const upIndex = ups.indexOf(userId);
    if (upIndex === -1) {
      ups.push(userId);
      action = 'up';
    } else {
      ups.splice(upIndex, 1);
      action = 'down';
    }

    await reply.save();

    ctx.body = {
      action,
      success: true,
    };
  }
}

module.exports = ReplyController;
