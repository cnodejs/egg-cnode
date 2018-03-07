'use strict';

module.exports = () => {
  /**
   * 需要登录
   */

  return async function(ctx, next) {
    const { session } = ctx
    if (!session || !session.passport.user || !session.passport.user._id) {
      ctx.status = 403;
      ctx.body = 'forbidden!';
      return;
    }
    await next();
  };
};
