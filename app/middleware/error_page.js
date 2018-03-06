'use strict';

module.exports = () => {
  return async function errorPage(ctx, next) {
    await next();
    if (ctx.status === 404 && !ctx.body) {
      const { message } = ctx;
      if (ctx.acceptJSON) {
        ctx.body = { error: 'Not Found' };
      } else {
        ctx.status = 404;
        await ctx.render('notify/notify', { error: message });
      }
    }
  };
};
