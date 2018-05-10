'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, middleware } = app;

  const { user } = controller.api;

  const tokenRequired = middleware.tokenRequired();
  // const adminRequired = middleware.adminRequired();
  // const createTopicLimit = middleware.createTopicLimit(config.topic);
  // const createUserLimit = middleware.createUserLimit(config.create_user_per_ip);

  router.get('/api/v1/user/:loginname', user.show);
  router.post('/api/v1/accesstoken', tokenRequired, user.verify);
};
