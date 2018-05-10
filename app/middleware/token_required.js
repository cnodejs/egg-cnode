'use strict';

module.exports = () => {
  return async function(ctx, next) {
    let token = '';
    if (
      ctx.headers.authorization && ctx.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
      token = ctx.headers.authorization.split(' ')[1];
    } else if (ctx.query.accesstoken) {
      token = ctx.query.accesstoken;
    } else if (ctx.request.body.accesstoken) {
      token = ctx.request.body.accesstoken;
    }

    const user = await ctx.service.user.getUserByToken(token);

    if (!user) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        error_msg: '错误的 accessToken',
      };
      return;
    }

    if (user.is_block) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error_msg: '您的账户被禁用',
      };
      return;
    }

    ctx.request.user = user;

    await next();
  };
};
