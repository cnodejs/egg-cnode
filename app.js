'use strict';

const tools = require('./app/common/tools');

module.exports = app => {
  if (app.config.debug) {
    app.config.coreMiddleware.unshift('less');
  }

  const localHandler = async (ctx, { username, password }) => {
    const getUser = username => {
      if (username.indexOf('@') > 0) {
        return ctx.service.user.getUserByMail(username);
      }
      return ctx.service.user.getUserByLoginName(username);
    };
    const existUser = await getUser(username);

    // 用户不存在
    if (!existUser) {
      return null;
    }

    const passhash = existUser.pass;
    // TODO: change to async compare
    const equal = tools.bcompare(password, passhash);
    // 密码不匹配
    if (!equal) {
      return null;
    }

    // 用户未激活
    if (!existUser.active) {
      // 发送激活邮件
      return null;
    }

    // 验证通过
    return existUser;
  };

  const githubHandler = async (ctx, { profile }) => {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    const existUser = await ctx.service.user.getUsersByQuery({
      githubId: profile.id,
    });

    // 用户不存在则创建
    // TODO
    if (!existUser) {
      return null;
    }

    // 用户存在，更新字段
    // existUser.loginname = profile.username;
    existUser.githubId = profile.id;
    existUser.email = email || existUser.email;
    existUser.avatar = profile._json.avatar_url;
    existUser.githubUsername = profile.username;
    existUser.githubAccessToken = profile.accessToken;
    await existUser.save();

    return existUser;
  };

  app.passport.verify(async (ctx, user) => {
    ctx.logger.debug('passport.verify', user);
    const handler = user.provider === 'github' ? githubHandler : localHandler;
    const existUser = await handler(ctx, user);
    if (existUser) {
      // id存入Cookie, 用于验证过期.
      const auth_token = existUser._id + '$$$$'; // 以后可能会存储更多信息，用 $$$$ 来分隔
      const opts = {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30,
        signed: true,
        httpOnly: true,
      };
      ctx.cookies.set(app.config.auth_cookie_name, auth_token, opts); // cookie 有效期30天
    }
    return existUser;
  });

  app.passport.serializeUser(async (ctx, user) => {
    // 默认会注入session.passport.user, 为方便使用改为session.user (?)
    ctx.session.user = user;
    return user;
  });
};
