'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, middleware } = app;

  const { user, message } = controller.api;

  const tokenRequired = middleware.tokenRequired();
  // const createTopicLimit = middleware.createTopicLimit(config.topic);
  // const createUserLimit = middleware.createUserLimit(config.create_user_per_ip);

  // 用户
  router.get('/api/v1/user/:loginname', user.show);
  router.post('/api/v1/accesstoken', tokenRequired, user.verify);

  // 消息通知
  router.get('/api/v1/message/count', tokenRequired, message.count);
  router.get('/api/v1/messages', tokenRequired, message.list);
  router.post('/api/v1/message/mark_all', tokenRequired, message.markAll);
  router.post('/api/v1/message/mark_one/:msg_id', tokenRequired, message.markOne);
};
