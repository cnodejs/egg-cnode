'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, config, middleware } = app;

  const { site, sign, user, topic, rss,
    search, page, reply, message } = controller;

  const userRequired = middleware.userRequired();
  const adminRequired = middleware.adminRequired();
  const createTopicLimit = middleware.createTopicLimit(config.topic);
  const createUserLimit = middleware.createUserLimit(config.create_user_per_ip);

  // home page
  router.get('/', site.index);
  // sitemap
  router.get('/sitemap.xml', site.sitemap);
  // mobile app download
  router.get('/app/download', site.appDownload);

  // sign controller
  if (config.allow_sign_up) {
    // 跳转到注册页面
    router.get('/signup', sign.showSignup);
    // 提交注册信息
    router.post('/signup', createUserLimit, sign.signup);
  } else {
    // 进行github验证
    router.redirect('/signup', '/passport/github');
  }

  const localStrategy = app.passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/signin',
  });

  router.get('/signin', sign.showLogin); // 进入登录页面
  router.post('/passport/local', localStrategy);
  router.all('/signout', sign.signout); // 登出
  router.get('/active_account', sign.activeAccount); // 帐号激活

  // github oauth
  app.passport.mount('github');

  router.get('/search_pass', sign.showSearchPass); // 找回密码页面
  router.post('/search_pass', sign.updateSearchPass); // 更新密码
  router.get('/reset_pass', sign.resetPass); // 进入重置密码页面
  router.post('/reset_pass', sign.updatePass); // 更新密码

  // user controller
  router.get('/user/:name', user.index); // 用户个人主页
  router.get('/setting', userRequired, user.showSetting); // 用户个人设置页
  router.post('/setting', userRequired, user.setting); // 提交个人信息设置
  router.get('/stars', user.listStars); // 显示所有达人列表页
  router.get('/users/top100', user.top100); // 显示积分前一百用户页
  router.get('/user/:name/collections', user.listCollectedTopics); // 用户收藏的所有话题页
  router.get('/user/:name/topics', user.listTopics); // 用户发布的所有话题页
  router.get('/user/:name/replies', user.listReplies); // 用户参与的所有回复页
  router.post('/user/set_star', adminRequired, user.toggleStar); // 把某用户设为达人
  router.post('/user/cancel_star', adminRequired, user.toggleStar); // 取消某用户的达人身份
  router.post('/user/:name/block', adminRequired, user.block); // 禁言某用户
  router.post('/user/:name/delete_all', adminRequired, user.deleteAll); // 删除某用户所有发言

  // message controler
  router.get('/my/messages', userRequired, message.index); // 用户个人的所有消息页

  // topic

  // 新建文章界面
  router.get('/topic/create', userRequired, topic.create);

  router.get('/topic/:tid', topic.index); // 显示某个话题
  router.post('/topic/:tid/top', adminRequired, topic.top); // 将某话题置顶
  router.post('/topic/:tid/good', adminRequired, topic.good); // 将某话题加精
  router.get('/topic/:tid/edit', userRequired, topic.showEdit); // 编辑某话题
  router.post('/topic/:tid/lock', adminRequired, topic.lock); // 锁定主题，不能再回复

  router.post('/topic/:tid/delete', userRequired, topic.delete);

  // 保存新建的文章
  router.post('/topic/create', userRequired, createTopicLimit, topic.put);

  router.post('/topic/:tid/edit', userRequired, topic.update);
  router.post('/topic/collect', userRequired, topic.collect); // 关注某话题
  router.post('/topic/de_collect', userRequired, topic.de_collect); // 取消关注某话题

  // reply controller
  router.post('/:topic_id/reply', userRequired,
    // limit.peruserperday('create_reply', config.create_reply_per_day, { showJson: false }),
    reply.add); // 提交一级回复
  router.get('/reply/:reply_id/edit', userRequired, reply.showEdit); // 修改自己的评论页
  router.post('/reply/:reply_id/edit', userRequired, reply.update); // 修改某评论
  router.post('/reply/:reply_id/delete', userRequired, reply.delete); // 删除某评论
  router.post('/reply/:reply_id/up', userRequired, reply.up); // 为评论点赞
  router.post('/upload', userRequired, topic.upload); // 上传图片
  // static page
  router.get('/about', page.about);
  router.get('/faq', page.faq);
  router.get('/getstart', page.getstart);
  router.get('/robots.txt', page.robots);
  router.get('/api', page.api);

  // rss
  router.get('/rss', rss.index);

  router.get('/search', search.index);
};
