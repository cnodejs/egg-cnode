'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const apiV1Router = app.router.namespace('/api/v1');
  const { controller, middleware } = app;

  const { user, message, topic } = controller.api;

  const tokenRequired = middleware.tokenRequired();
  const pagination = middleware.pagination();
  // const adminRequired = middleware.adminRequired();
  // const createTopicLimit = middleware.createTopicLimit(config.topic);
  // const createUserLimit = middleware.createUserLimit(config.create_user_per_ip);

  // 用户
  apiV1Router.get('/user/:loginname', user.show);
  apiV1Router.post('/accesstoken', tokenRequired, user.verify);

  // 消息通知
  apiV1Router.get('/message/count', tokenRequired, message.count);
  apiV1Router.get('/messages', tokenRequired, message.list);
  apiV1Router.post('/message/mark_all', tokenRequired, message.markAll);
  apiV1Router.post('/message/mark_one/:msg_id', tokenRequired, message.markOne);

  // 主题
  apiV1Router.get('/topics', pagination, topic.index);
  apiV1Router.get('/topic/:id', topic.show);
  apiV1Router.post('/topics', tokenRequired, topic.create);
  apiV1Router.post('/topics/update', tokenRequired, topic.update);
};
