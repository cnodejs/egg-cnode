'use strict';

const Controller = require('egg').Controller;

class ReplyController extends Controller {
  /**
   * 添加回复
   */
  async add() {
    const { ctx, service } = this;
    const content = ctx.body.r_content;
    const reply_id = ctx.body.reply_id;

    if (content.trim() === '') {
      ctx.status = 422;
      ctx.message = '回复内容不能为空！';
      return;
    }

    const topic_id = ctx.params.topic_id;
    const topic = await service.topic.getTopicById(topic_id);

    if (!topic) {
      ctx.status = 404;
      ctx.message = '这个主题不存在。';
      return;
    }
    if (topic.lock) {
      ctx.status = 403;
      ctx.message = '此主题已锁定。';
      return;
    }

    const user_id = ctx.session.user._id;
    const topicAuthor = await service.user.getUserById(topic.author_id);
    const newContent = content.replace('@' + topicAuthor.loginname + ' ', '');
    const [
      reply, user,
    ] = await Promise.all([
      service.reply.newAndSave(content, topic_id, user_id, reply_id),
      service.user.getUserById(user_id),
    ]);

    user.score += 5;
    user.reply_count += 1;
    await Promise.all([
      service.topic.updateLastReply(topic_id, reply._id),
      user.save(),
    ]);
    service.at.sendMessageToMentionUsers(newContent, topic_id, user_id, reply._id);
    if (topic.author_id.toString() !== user_id.toString()) {
      await service.message.sendReplyMessage(topic.author_id, user_id, topic._id, reply._id);
    }

    ctx.redirect('/topic/' + topic_id + '#' + reply._id);
  }
  /**
   * 打开回复编辑器
   */
  async showEdit() {
    const { ctx, service } = this;
    const reply_id = ctx.params.topic_id;
    const reply = await service.reply.getReplyById(reply_id);

    if (!reply) {
      ctx.status = 404;
      ctx.message = '此回复不存在或已被删除。';
      return;
    }
    if (ctx.session.user._id.toString() === reply.author_id.toString() || ctx.session.user.is_admin) {
      await ctx.render('reply/edit', {
        reply_id: reply._id,
        content: reply.content,
      });
    } else {
      ctx.status = 403;
      ctx.message = '对不起，你不能编辑此回复。';
      return;
    }
  }
  /**
   * 提交编辑回复
   */
  async update() {
    const { ctx, service } = this;
    const reply_id = ctx.params.reply_id;
    const content = ctx.body.t_content;
    const reply = await service.reply.getReplyById(reply_id);

    if (!reply) {
      ctx.status = 404;
      ctx.message = '此回复不存在或已被删除。';
      return;
    }
    if (ctx.session.user._id.toString() === reply.author_id.toString() || ctx.session.user.is_admin) {
      if (content.trim() !== '') {
        reply.content = content;
        reply.update_at = new Date();
        await reply.save();
        ctx.redirect('/topic/' + reply.topic_id + '#' + reply._id);
      } else {
        ctx.status = 400;
        ctx.message = '回复的字数太少。';
        return;
      }
    } else {
      ctx.status = 403;
      ctx.message = '对不起，你不能编辑此回复。';
      return;
    }
  }
  /**
   * 删除回复
   */
  async delete() {
    const { ctx, service } = this;
    const reply_id = ctx.params.reply_id;
    const reply = await service.reply.getReplyById(reply_id);

    if (!reply) {
      ctx.status = 422;
      ctx.body = { status: 'no reply ' + reply_id + ' exists' };
      return;
    }
    if (reply.author_id.toString() === ctx.session.user._id.toString() || ctx.session.user.is_admin) {
      reply.deleted = true;
      reply.save();
      ctx.status = 200;
      ctx.body = { status: 'success' };
      reply.author.score -= 5;
      reply.author.reply_count -= 1;
      reply.author.save();
    } else {
      ctx.status = 200;
      ctx.body = { status: 'failed' };
    }
    service.topic.reduceCount(reply.topic_id);
    return;
  }
  /**
   * 回复点赞
   */
  async up() {
    const { ctx, service } = this;
    const reply_id = ctx.params.reply_id;
    const user_id = ctx.session.user._id;
    const reply = await service.reply.getReplyById(reply_id);

    if (!reply) {
      ctx.status = 404;
      ctx.message = '此回复不存在或已被删除。';
      return;
    }
    if (reply.author_id.toString() === user_id.toString()) {
      ctx.body = {
        success: false,
        message: '呵呵，不能帮自己点赞。',
      };
      return;
    }
    let action;
    reply.ups = reply.ups || [];
    const upIndex = reply.ups.indexOf(user_id);
    if (upIndex === -1) {
      reply.ups.push(user_id);
      action = 'up';
    } else {
      reply.ups.splice(upIndex, 1);
      action = 'down';
    }
    await reply.save();
    ctx.body = {
      success: true,
      action,
    };
    return;
  }
}

module.exports = ReplyController;
