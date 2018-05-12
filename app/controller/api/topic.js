'use strict';

const Controller = require('egg').Controller;
const _ = require('lodash');

class TopicController extends Controller {
  async index(ctx) {
    const tab = ctx.query.tab || 'all';
    const mdrender = ctx.query.mdrender !== 'false';

    const query = {};
    if (!tab || tab === 'all') {
      query.tab = { $nin: [ 'job', 'dev' ] };
    } else {
      if (tab === 'good') {
        query.good = true;
      } else {
        query.tab = tab;
      }
    }

    let topics = await ctx.service.topic.getTopicsByQuery(query,
      // TODO 修改 eslint 支持在 {} 内使用 ...，栗子：{ sort: '-top -last_reply_at', ...ctx.pagination }
      Object.assign({ sort: '-top -last_reply_at' }, ctx.pagination));
    topics = topics.map(topic => {
      topic.content = mdrender ? ctx.helper.markdown(topic.content) : topic.content;
      topic.author = _.pick(topic.author, [ 'loginname', 'avatar_url' ]);
      topic.id = topic._id;
      return _.pick(topic, [ 'id', 'author_id', 'tab', 'content', 'title', 'last_reply_at',
        'good', 'top', 'reply_count', 'visit_count', 'create_at', 'author' ]);
    });

    ctx.body = {
      success: true,
      data: topics,
    };
  }

  async create(ctx) {
    const all_tabs = ctx.app.config.tabs.map(tab => {
      return tab[ 0 ];
    });

    // TODO: 此处可以优化，将所有使用 egg_validate 的 rules 集中管理，避免即时新建对象
    ctx.validate({
      title: {
        type: 'string',
        max: 100,
        min: 5,
      },
      tab: { type: 'enum', values: all_tabs },
      content: { type: 'string' },
    });

    const body = ctx.request.body;

    // 储存新主题帖
    const topic = await ctx.service.topic.newAndSave(
      body.title,
      body.content,
      body.tab,
      ctx.request.user.id
    );

    // 发帖用户增加积分,增加发表主题数量
    await ctx.service.user.incrementScoreAndReplyCount(topic.author_id, 5, 1);

    // 通知被@的用户
    await ctx.service.at.sendMessageToMentionUsers(
      body.content,
      topic.id,
      ctx.request.user.id
    );

    ctx.body = {
      success: true,
      topic_id: topic.id,
    };
  }

  async show(ctx) {
    ctx.validate({
      id: {
        type: 'string',
        max: 24,
        min: 24,
      },
    }, ctx.params);

    const topic_id = String(ctx.params.id);
    const mdrender = ctx.query.mdrender !== 'false';
    const user = await ctx.service.user.getUserByToken(ctx.query.accesstoken);

    let [ topic, author, replies ] = await ctx.service.topic.getFullTopic(topic_id);

    if (!topic) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error_msg: '此话题不存在或已被删除',
      };
      return;
    }

    // 增加 visit_count
    topic.visit_count += 1;
    // 写入 DB
    await ctx.service.topic.incrementVisitCount(topic_id);

    topic.content = mdrender ? ctx.helper.markdown(topic.content) : topic.content;
    topic.id = topic._id;
    topic = _.pick(topic, [ 'id', 'author_id', 'tab', 'content', 'title', 'last_reply_at',
      'good', 'top', 'reply_count', 'visit_count', 'create_at', 'author' ]);

    topic.author = _.pick(author, [ 'loginname', 'avatar_url' ]);

    topic.replies = replies.map(reply => {
      reply.content = mdrender ? ctx.helper.markdown(reply.content) : reply.content;

      reply.author = _.pick(reply.author, [ 'loginname', 'avatar_url' ]);
      reply.id = reply._id;
      reply = _.pick(reply, [ 'id', 'author', 'content', 'ups', 'create_at', 'reply_id' ]);
      reply.reply_id = reply.reply_id || null;

      reply.is_uped = !!(reply.ups && user && reply.ups.indexOf(user.id) !== -1);

      return reply;
    });

    topic.is_collect = user ? !!await ctx.service.topicCollect.getTopicCollect(
      user.id,
      topic_id
    ) : false;

    ctx.body = {
      success: true,
      data: topic,
    };
  }

  async update(ctx) {

    const all_tabs = ctx.app.config.tabs.map(tab => {
      return tab[ 0 ];
    });

    ctx.validate({
      topic_id: {
        type: 'string',
        max: 24,
        min: 24,
      },
      title: {
        type: 'string',
        max: 100,
        min: 5,
      },
      tab: { type: 'enum', values: all_tabs },
      content: { type: 'string' },
    });

    const body = ctx.request.body;

    let { topic } = await ctx.service.topic.getTopicById(body.topic_id);
    if (!topic) {
      ctx.status = 404;
      ctx.body = { success: false, error_msg: '此话题不存在或已被删除。' };
      return;
    }

    if (!topic.author_id.equals(ctx.request.user._id) && !ctx.request.is_admin) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error_msg: '对不起，你不能编辑此话题',
      };
      return;
    }

    delete body.accesstoken;
    topic = Object.assign(topic, body);
    topic.update_at = new Date();

    await topic.save();

    // 通知被 @ 的人
    await ctx.service.at.sendMessageToMentionUsers(
      topic.content,
      topic.id,
      ctx.request.user.id
    );

    ctx.body = {
      success: true,
      topic_id: topic.id,
    };
  }
}

module.exports = TopicController;
