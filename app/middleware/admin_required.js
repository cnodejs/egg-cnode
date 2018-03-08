'use strict';

module.exports = () => {
  /*
   * 需要管理员权限
   */

  return async function(ctx, next) {
    if (!ctx.session.user) {
      await ctx.render('notify/notify', { error: '你还没有登录。' });
      return;
    }

    if (!ctx.session.user.is_admin) {
      await ctx.render('notify/notify', { error: '需要管理员权限。' });
      return;
    }

    await next();
  };
};
