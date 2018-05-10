'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const apiV1Router = app.router.namespace('/api/v1');
  const { controller, middleware } = app;

  const { user } = controller.api;

  const tokenRequired = middleware.tokenRequired();
  // const adminRequired = middleware.adminRequired();
  // const createTopicLimit = middleware.createTopicLimit(config.topic);
  // const createUserLimit = middleware.createUserLimit(config.create_user_per_ip);

  apiV1Router.get('/user/:loginname', user.show);
  apiV1Router.post('/accesstoken', tokenRequired, user.verify);
};
