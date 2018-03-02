'use strict';

module.exports = app => {
  if (app.config.debug) {
    app.config.coreMiddleware.unshift('less');
  }

  app.beforeStart(async () => {
  });
};
