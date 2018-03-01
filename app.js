'use strict';

module.exports = app => {
  app.beforeStart(async () => {
    app.mongodbClient;
  });
};
