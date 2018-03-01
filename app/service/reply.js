'use strict';

const mongoose = require('mongoose');
const BaseModel = require('../models/base_model');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

module.exports = app => {

  const ReplySchema = new Schema({
    content: { type: String },
    topic_id: { type: ObjectId },
    author_id: { type: ObjectId },
    reply_id: { type: ObjectId },
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now },
    content_is_html: { type: Boolean },
    ups: [ Schema.Types.ObjectId ],
    deleted: { type: Boolean, default: false },
  });

  ReplySchema.plugin(BaseModel);
  ReplySchema.index({ topic_id: 1 });
  ReplySchema.index({ author_id: 1, create_at: -1 });

  const Reply = mongoose.model('Reply', ReplySchema);

  return class Service extends app.Service {

    /*
     * 获取一条回复信息
     * @param {String} id 回复ID
     * @param {Function} callback 回调函数
     * @return {Promise[reply]} 承载 replay 的 Promise 对象
     */
    getReply(id) {
      return Reply.findOne({ _id: id }).exec();
    }

    /*
     * 根据回复ID，获取回复
     * @param {String} id 回复ID
     * @return {Promise[reply]} 承载 replay 的 Promise 对象
     */
    async getReplyById(id) {
      if (!id) {
        return null;
      }

      const reply = await Reply.findOne({ _id: id }).exec();

      if (!reply) {
        return null;
      }

      const author_id = reply.author_id;
      const author = await this.service.user.getUserById(author_id);

      reply.author = author;
      // TODO: 添加更新方法，有些旧帖子可以转换为markdown格式的内容
      if (reply.content_is_html) {
        return reply;
      }

      const str = this.service.at.linkUsers(reply.content);
      reply.content = str;
      return reply;
    }

    /*
     * 根据主题ID，获取回复列表
     * Callback:
     * - err, 数据库异常
     * - replies, 回复列表
     * @param {String} id 主题ID
     * @return {Promise[replies]} 承载 replay 列表的 Promise 对象
     */
    async getRepliesByTopicId(id) {
      const query = { topic_id: id, deleted: false };
      const replies = await Reply.find(query, '', { sort: 'create_at' }).exec();

      if (replies.length === 0) {
        return [];
      }

      return Promise.all(replies.map(async item => {
        const author = await this.service.user.getUserById(item.author_id);
        item.author = author || { _id: '' };
        if (item.content_is_html) {
          return;
        }
        item.content = await this.service.at.linkUsers(item.content);
      }));
    }

    /*
     * 创建并保存一条回复信息
     * @param {String} content 回复内容
     * @param {String} topicId 主题ID
     * @param {String} authorId 回复作者
     * @param {String} [replyId] 回复ID，当二级回复时设定该值
     * @return {Promise} 承载 replay 列表的 Promise 对象
     */
    async newAndSave(content, topicId, authorId, replyId = null) {
      const reply = new Reply();
      reply.content = content;
      reply.topic_id = topicId;
      reply.author_id = authorId;

      if (replyId) {
        reply.reply_id = replyId;
      }

      await reply.save();

      return reply;
    }

    /*
     * 根据topicId查询到最新的一条未删除回复
     * @param topicId 主题ID
     * @return {Promise[reply]} 承载 replay 的 Promise 对象
     */
    getLastReplyByTopId(topicId) {
      const query = { topic_id: topicId, deleted: false };
      const opts = { sort: { create_at: -1 }, limit: 1 };
      return Reply.find(query, '_id', opts).exec();
    }

    getRepliesByAuthorId(authorId, opt = null) {
      return Reply.find({ author_id: authorId }, {}, opt).exec();
    }

    // 通过 author_id 获取回复总数
    getCountByAuthorId(authorId) {
      return Reply.count({ author_id: authorId }).exec();
    }
  };
};
