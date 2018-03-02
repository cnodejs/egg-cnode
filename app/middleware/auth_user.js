'use strict';

module.exports = () => {
  // 验证用户是否登录
  return async function(ctx, next) {
    // Ensure current_user always has defined.
    ctx.locals.current_user = null;
    if (ctx.app.config.debug && ctx.cookies.get('mock_user')) {
      const mockUser = JSON.parse(ctx.cookies.get('mock_user'));
      ctx.session.user = new ctx.model.User(mockUser);
      if (mockUser.is_admin) {
        ctx.session.user.is_admin = true;
      }
      return await next();
    }

    let user = ctx.session.user;
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

    const count = await this.service.message.getMessagesCount(user._id);
    user.messages_count = count;
    ctx.session.user = user;
    ctx.locals.current_user = user;
    await next();
  };
};
