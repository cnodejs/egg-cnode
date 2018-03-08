'use strict';

module.exports = () => {
  /**
   * 需要登录
   */

  return async function(ctx, next) {
    const { session } = ctx;
    if (!session.user || !session.user._id) {
      ctx.status = 403;
      ctx.body = 'forbidden!';
      return;
    }
    await next();
  };
};
