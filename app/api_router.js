'use strict';

module.exports = function(app) {
  const { router, controller, config } = app;
  const { topic, topicCollect, user, toolsController,
    reply, message } = controller.v1;

  // Open API
  var topic   = require('./api/v1/topic');
  var topicCollectController = require('./api/v1/topic_collect');
  var userController    = require('./api/v1/user');
  var toolsController   = require('./api/v1/tools');
  var replyController   = require('./api/v1/reply');
  var messageController = require('./api/v1/message');
  var middleware        = require('./api/v1/middleware');

  var limit             = require('./middlewares/limit');

  // 主题
  router.get('/api/v1/topics', topic.index);
  router.get('/api/v1/topic/:id', middleware.tryAuth, topic.show);
  router.post('/api/v1/topics', middleware.auth,
    limit.peruserperday('create_topic', config.create_post_per_day,
      {showJson: true}), topic.create);
  router.post('/api/v1/topics/update', middleware.auth,
    topic.update);

  // 主题收藏
  router.post('/api/v1/topic_collect/collect', middleware.auth,
    topicCollectController.collect); // 关注某话题
  router.post('/api/v1/topic_collect/de_collect', middleware.auth,
    topicCollectController.de_collect); // 取消关注某话题
  router.get('/api/v1/topic_collect/:loginname',
    topicCollectController.list);

  // 用户
  router.get('/api/v1/user/:loginname', userController.show);

  // accessToken 测试
  router.post('/api/v1/accesstoken', middleware.auth,
    toolsController.accesstoken);

  // 评论
  router.post('/api/v1/topic/:topic_id/replies', middleware.auth,
    limit.peruserperday('create_reply', config.create_reply_per_day,
      {showJson: true}), replyController.create);
  router.post('/api/v1/reply/:reply_id/ups', middleware.auth,
    replyController.ups);

  // 通知
  router.get('/api/v1/messages', middleware.auth,
    messageController.index);
  router.get('/api/v1/message/count', middleware.auth,
    messageController.count);
  router.post('/api/v1/message/mark_all', middleware.auth,
    messageController.markAll);
  router.post('/api/v1/message/mark_one/:msg_id', middleware.auth,
    messageController.markOne);
};
