'use strict';

module.exports = () => {
  // 验证用户是否登录
  return async function(ctx, next) {
    // Ensure current_user always has defined.
    ctx.locals.current_user = null;
    if (ctx.app.config.debug && ctx.cookies.get('mock_user')) {
      const mockUser = JSON.parse(ctx.cookies.get('mock_user'));
      ctx.user = new ctx.model.User(mockUser);
      if (mockUser.is_admin) {
        ctx.user.is_admin = true;
      }
      return await next();
    }

    let { user } = ctx;
    if (user) {
      const auth_token = ctx.cookies.get(ctx.app.config.auth_cookie_name, {
        signed: true,
      });

      if (!auth_token) {
        return await next();
      }

      const auth = auth_token.split('$$$$');
      const user_id = auth[0];
      user = await ctx.service.user.getUserById(user_id);
    }

    if (!user) {
      return await next();
    }

    if (ctx.app.config.admins.hasOwnProperty(user.loginname)) {
      user.is_admin = true;
    }

    const count = await ctx.service.message.getMessagesCount(user._id);
    user.messages_count = count;
    ctx.locals.current_user = user;
    // 这里需要设置is_admin, 因为ctx.user为只读, 所以使用ctx.session.is_admin
    ctx.session.is_admin = user.is_admin;
    await next();
  };
};
