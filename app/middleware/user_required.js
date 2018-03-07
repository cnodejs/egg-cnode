'use strict';

module.exports = (options, app) => {

  /**
   * 需要登录
   */
  return async function(ctx, next) {
    if (!ctx.session || !ctx.session.user || !ctx.session.user._id) {
      ctx.status = 403;
      ctx.body = 'forbidden!';
      return;
    }
    await next();
  };
};
