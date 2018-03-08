'use strict';

const Controller = require('egg').Controller;
const _ = require('lodash');
const validator = require('validator');
const path = require('path');
const fs = require('fs');
const awaitWriteStream = require('await-stream-ready').write;
const sendToWormhole = require('stream-wormhole');

const qnUpload = require('../common/upload');

class TopicController extends Controller {
  /**
   * Topic page
   */
  async index() {
    function isUped(user, reply) {
      if (!reply.ups) {
        return false;
      }
      return reply.ups.indexOf(user._id) !== -1;
    }
    const { ctx, service } = this;
    const topic_id = ctx.params.tid;
    const currentUser = ctx.session.user;

    if (topic_id.length !== 24) {
      ctx.status = 404;
      // '此话题不存在或已被删除。'
      return;
    }

    const [ topic, author, replies ] = await service.topic.getFullTopic(topic_id);

    topic.visit_count += 1;
    await topic.save();

    topic.author = author;
    topic.replies = replies;

    // 点赞数排名第三的回答，它的点赞数就是阈值
    topic.reply_up_threshold = (function() {
      let allUpCount = replies.map(function(reply) {
        return (reply.ups && reply.ups.length) || 0;
      });
      allUpCount = _.sortBy(allUpCount, Number).reverse();

      let threshold = allUpCount[2] || 0;
      if (threshold < 3) {
        threshold = 3;
      }
      return threshold;
    })();

    const options = { limit: 5, sort: '-last_reply_at' };
    const query = { author_id: topic.author_id, _id: { $nin: [ topic._id ] } };
    const other_topics = await service.topic.getTopicsByQuery(query, options);

    // get no_reply_topics
    let no_reply_topics = service.cache.get('no_reply_topics');
    if (!no_reply_topics) {
      const query = { reply_count: 0, tab: { $nin: [ 'job', 'dev' ] } };
      const options = { limit: 5, sort: '-create_at' };
      no_reply_topics = await service.topic.getTopicsByQuery(query, options);
      await service.cache.setex('no_reply_topics', no_reply_topics, 60 * 1);
    }

    let is_collect;
    if (!currentUser) {
      is_collect = null;
    } else {
      is_collect = service.topicCollect.getTopicCollect(
        currentUser._id,
        topic_id
      );
    }

    await ctx.render('topic/index', {
      topic,
      author_other_topics: other_topics,
      no_reply_topics,
      is_uped: isUped,
      is_collect,
    });
  }

  /**
   * 进入创建主题页面
   */
  async create() {
    const { ctx, config } = this;
    await ctx.render('topic/edit', {
      tabs: config.tabs,
    });
  }

  /**
   * 发表主题帖
   */
  async put() {
    const { ctx, service } = this;
    const { tabs } = this.config;
    const title = validator.trim(ctx.body.title);
    const tab = validator.trim(ctx.body.tab);
    const content = validator.trim(ctx.body.t_content);

    // 得到所有的 tab, e.g. ['ask', 'share', ..]
    const allTabs = tabs.map(function(tPair) {
      return tPair[0];
    });

    // 验证
    let editError;
    if (title === '') {
      editError = '标题不能是空的。';
    } else if (title.length < 5 || title.length > 100) {
      editError = '标题字数太多或太少。';
    } else if (!tab || allTabs.indexOf(tab) === -1) {
      editError = '必须选择一个版块。';
    } else if (content === '') {
      editError = '内容不可为空';
    }
    // END 验证

    if (editError) {
      ctx.status = 422;
      await ctx.render('topic/edit', {
        edit_error: editError,
        title,
        content,
        tabs,
      });
      return;
    }

    // 储存新主题帖
    const topic = await service.topic.newAndSave(
      title,
      content,
      tab,
      ctx.session.user._id
    );

    // 发帖用户增加积分,增加发表主题数量
    const author = await service.user.getUserById(topic.author_id);
    author.score += 5;
    author.topic_count += 1;
    await author.save();
    ctx.session.user = author;

    ctx.redirect('/topic/' + topic._id);

    // 通知被@的用户
    await service.at.sendMessageToMentionUsers(
      content,
      topic._id,
      ctx.session.user._id
    );
  }

  /**
   * 显示编辑页面
   */
  async showEdit() {
    const { ctx, service, config } = this;
    const topic_id = ctx.params.tid;

    const { topic } = await service.topic.getTopicById(topic_id);
    if (!topic) {
      ctx.status = 404;
      ctx.message = '此话题不存在或已被删除。';
      return;
    }

    if (
      String(topic.author_id) === String(ctx.session.user._id) ||
      ctx.session.user.is_admin
    ) {
      await ctx.render('topic/edit', {
        action: 'edit',
        topic_id: topic._id,
        title: topic.title,
        content: topic.content,
        tab: topic.tab,
        tabs: config.tabs,
      });
    } else {
      ctx.status = 403;
      // ctx.message = '对不起，你不能编辑此话题。';
    }
  }

  /**
   * 更新主题帖
   */
  async update() {
    const { ctx, service, config } = this;

    const topic_id = ctx.params.tid;
    let title = ctx.request.body.title;
    let tab = ctx.request.body.tab;
    let content = ctx.request.body.t_content;

    const { topic } = await service.topic.getTopicById(topic_id);
    if (!topic) {
      ctx.status = 404;
      ctx.message = '此话题不存在或已被删除。';
      return;
    }

    if (
      topic.author_id === ctx.session.user._id || ctx.session.user.is_admin
    ) {
      title = validator.trim(title);
      tab = validator.trim(tab);
      content = validator.trim(content);

      // 验证
      let editError;
      if (title === '') {
        editError = '标题不能是空的。';
      } else if (title.length < 5 || title.length > 100) {
        editError = '标题字数太多或太少。';
      } else if (!tab) {
        editError = '必须选择一个版块。';
      }
      // END 验证

      if (editError) {
        await ctx.render('topic/edit', {
          action: 'edit',
          edit_error: editError,
          topic_id: topic._id,
          content,
          tabs: config.tabs,
        });
        return;
      }

      // 保存话题
      topic.title = title;
      topic.content = content;
      topic.tab = tab;
      topic.update_at = new Date();

      await topic.save();

      await service.at.sendMessageToMentionUsers(
        content,
        topic._id,
        ctx.session.user._id
      );

      ctx.redirect('/topic/' + topic._id);
    } else {
      ctx.status = 403;
      ctx.message = '对不起，你不能编辑此话题。';
    }
  }

  /**
   * 删除主题帖
   */
  async delete() {
    // 删除话题, 话题作者topic_count减1
    // 删除回复，回复作者reply_count减1
    // 删除topic_collect，用户collect_topic_count减1
    const { ctx, service } = this;
    const topic_id = ctx.params.tid;

    const [ topic, author ] = await service.topic.getFullTopic(topic_id);

    if (
      !ctx.session.user.is_admin &&
      !topic.author_id.equals(ctx.session.user._id)
    ) {
      ctx.status = 403;
      ctx.body = { success: false, message: '无权限' };
      return;
    }

    if (!topic) {
      ctx.status = 422;
      ctx.body = { success: false, message: '此话题不存在或已被删除。' };
      return;
    }

    author.score -= 5;
    author.topic_count -= 1;
    await author.save();

    topic.deleted = true;

    await topic.save();
    ctx.body = { success: true, message: '话题已被删除。' };
  }

  /**
   * 设为置顶
   */
  async top() {
    const { ctx, service } = this;
    const topic_id = ctx.params.tid;
    const referer = ctx.get('referer');

    if (topic_id.length !== 24) {
      ctx.status = 404;
      ctx.message = '此话题不存在或已被删除。';
      return;
    }

    const topic = await service.topic.getTopic(topic_id);

    if (!topic) {
      ctx.status = 404;
      ctx.message = '此话题不存在或已被删除。';
      return;
    }
    topic.top = !topic.top;
    await topic.save();
    const msg = topic.top ? '此话题已置顶。' : '此话题已取消置顶。';
    await ctx.render('notify/notify', { success: msg, referer });
  }

  /**
   * 设为精华
   */
  async good() {
    const { ctx, service } = this;
    const topic_id = ctx.params.tid;
    const referer = ctx.get('referer');

    const topic = await service.topic.getTopic(topic_id);
    if (!topic) {
      ctx.status = 404;
      ctx.message = '此话题不存在或已被删除。';
      return;
    }
    topic.good = !topic.good;
    await topic.save();
    const msg = topic.good ? '此话题已加精。' : '此话题已取消加精。';
    await ctx.render('notify/notify', { success: msg, referer });
  }

  /**
   * 锁定帖子,不能回复
   */
  async lock() {
    const { ctx, service } = this;
    const topic_id = ctx.params.tid;
    const referer = ctx.get('referer');

    const topic = await service.topic.getTopic(topic_id);
    if (!topic) {
      ctx.status = 404;
      ctx.message = '此话题不存在或已被删除。';
      return;
    }
    topic.lock = !topic.lock;
    await topic.save();
    const msg = topic.lock ? '此话题已锁定。' : '此话题已取消锁定。';
    await ctx.render('notify/notify', { success: msg, referer });
  }

  /**
   * 收藏主题帖
   */
  async collect() {
    const { ctx, service } = this;
    const topic_id = ctx.request.body.topic_id;

    const topic = await service.topic.getTopic(topic_id);

    if (!topic) {
      ctx.body = { status: 'failed' };
    }

    const doc = await service.topic_collect.getTopicCollect(
      ctx.session.user._id,
      topic._id
    );

    if (doc) {
      ctx.body = { status: 'failed' };
      return;
    }

    service.topic_collect.newAndSave(ctx.session.user._id, topic._id);
    ctx.body = { status: 'success' };

    const user = await service.user.getUserById(ctx.session.user._id);
    user.collect_topic_count += 1;
    await user.save();

    ctx.session.user.collect_topic_count += 1;
    topic.collect_count += 1;
    await topic.save();
  }

  /**
   * 取消收藏主题帖
   */
  async de_collect() {
    const { ctx, service } = this;
    const topic_id = ctx.request.body.topic_id;
    const topic = await service.topic.getTopic(topic_id);

    if (!topic) {
      ctx.body = { status: 'failed' };
    }

    const removeResult = service.topic_collect.remove(
      ctx.session.user._id,
      topic._id
    );
    if (removeResult.result.n === 0) {
      ctx.body = { status: 'failed' };
    }

    const user = await service.user.getUserById(ctx.session.user._id);

    user.collect_topic_count -= 1;
    ctx.session.user = user;
    await user.save();

    topic.collect_count -= 1;
    await topic.save();

    ctx.body = { status: 'success' };
  }

  /**
   * 上传
   */
  async upload() {
    const { ctx, config } = this;
    const stream = await ctx.getFileStream();
    const filename = encodeURIComponent(stream.fields.name) +
      path.extname(stream.filename).toLowerCase();
    const target = path.join(config.upload.path, filename);

    // 如果有七牛云的配置,优先上传七牛云
    if (config.qn_access) {
      try {
        const upload = qnUpload(config.qn_access);
        const result = await upload(stream);
        ctx.body = {
          success: true,
          url: result.url,
        };
      } catch (err) {
        await sendToWormhole(stream);
        throw err;
      }
    } else {
      const writeStream = fs.createWriteStream(target);
      try {
        await awaitWriteStream(stream.pipe(writeStream));
        ctx.body = {
          success: true,
          url: config.upload.url + filename,
        };
      } catch (err) {
        await sendToWormhole(stream);
        throw err;
      }
    }
  }
}

module.exports = TopicController;
