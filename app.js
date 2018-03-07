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
    return handler(ctx, user);
  });

  // 将用户信息序列化后存进 session 里面，一般需要精简，只保存个别字段
  // app.passport.serializeUser(async (ctx, user) => {
  //   // 处理 user
  //   // ...
  //   // ctx.session.passport.user = user;
  //   return user;
  // });
  //
  // // 反序列化后把用户信息从 session 中取出来，反查数据库拿到完整信息
  // app.passport.deserializeUser(async (ctx, user) => {
  //   // 处理 user
  //   // ...
  //   // console.log(ctx.session.passport);
  //   return user;
  // });
};
