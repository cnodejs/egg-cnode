'use strict';

module.exports = app => {
  app.config.coreMiddleware.unshift('less');

  app.beforeStart(async () => {
    app.mongodbClient;
  });
};
