'use strict';

const path = require('path');

const loader = require('loader-koa');

module.exports = (options, app) => {
  // 验证用户是否登录
  if (app.config.debug) {
    return loader.less(path.join(app.baseDir, 'app'));
  }
  return async function (ctx, next) {
    await next();
  };
};
