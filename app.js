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
    const equal = tools.bcompare(passhash, password);

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
    return handler(ctx, user);
  });
};
