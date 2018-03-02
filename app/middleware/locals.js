'use strict';

const Loader = require('loader');

module.exports = (options, app) => {
  // assets
  let assets = {};
  const logger = app.logger;

  if (app.config.mini_assets) {
    try {
      assets = require('./assets.json');
    } catch (e) {
      logger.error(
        'You must execute `make build` before start app when mini_assets is true.'
      );
      throw e;
    }
  }

  // 验证用户是否登录
  return async function(ctx, next) {
    ctx.locals.config = app.config;
    ctx.locals.Loader = Loader;
    ctx.locals.assets = assets;
    ctx.locals.csrf = ctx.csrf;
    await next();
  };
};
