'use strict';

const Controller = require('egg').Controller;
const _ = require('lodash');

const MongoObjectIdSchema = {
  type: 'string',
  max: 24,
  min: 24,
};

class CollectController extends Controller {
  async index() {
    const { ctx, service } = this;
    const name = ctx.params.name;

    const user = await service.user.getUserByLoginName(name);

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error_msg: '用户不存在',
      };
      return;
    }

    const opt = { skip: 0, limit: 100 };

    const collects = await service.topicCollect.getTopicCollectsByUserId(user._id, opt);
    const ids = collects.map(doc => {
      return doc.topic_id.toString();
    });

    const query = { _id: { $in: ids } };
    let topics = await service.topic.getTopicsByQuery(query, {});

    topics = _.sortBy(topics, topic => {
      return ids.indexOf(topic._id.toString());
    });

    topics = topics.map(topic => {
      topic.author = _.pick(topic.author, [ 'loginname', 'avatar_url' ]);
      return _.pick(topic, [ 'id', 'author_id', 'tab', 'content', 'title', 'last_reply_at',
        'good', 'top', 'reply_count', 'visit_count', 'create_at', 'author' ]);
    });

    ctx.body = {
      success: true,
      data: topics,
    };
  }

  async collect() {
    const { ctx, service } = this;
    const topic_id = ctx.request.body.topic_id;
    const user_id = ctx.request.user.id;

    ctx.validate({
      topic_id: MongoObjectIdSchema,
    }, ctx.request.body);

    const topic = await service.topic.getTopic(topic_id);

    if (!topic) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error_msg: '话题不存在',
      };
      return;
    }

    const doc = await service.topicCollect.getTopicCollect(
      user_id,
      topic._id
    );

    if (doc) {
      ctx.body = {
        success: false,
        error_msg: '已经收藏过该主题',
      };
      return;
    }

    await service.topicCollect.newAndSave(user_id, topic._id);
    await Promise.all([
      service.user.incrementCollectTopicCount(user_id),
      service.topic.incrementCollectCount(topic_id),
    ]);

    ctx.body = { success: true };
  }

  async de_collect() {
    const { ctx, service } = this;
    const topic_id = ctx.request.body.topic_id;
    const user_id = ctx.request.user.id;

    ctx.validate({
      topic_id: MongoObjectIdSchema,
    }, ctx.request.body);

    const topic = await service.topic.getTopic(topic_id);

    if (!topic) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error_msg: '话题不存在',
      };
      return;
    }

    const removeResult = await service.topicCollect.remove(
      user_id,
      topic._id
    );

    if (removeResult.result.n === 0) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        error_msg: '取消收藏失败',
      };
      return;
    }

    const user = await service.user.getUserById(user_id);

    user.collect_topic_count -= 1;
    await user.save();

    topic.collect_count -= 1;
    await topic.save();

    ctx.body = { success: true };
  }
}

module.exports = CollectController;
