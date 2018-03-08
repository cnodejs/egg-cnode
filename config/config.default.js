'use strict';

module.exports = appinfo => {
  const config = {};

  config.name = 'CNode';

  // debug 为 true 时，用于本地调试
  config.debug = true;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appinfo.name + '_1519887194138_3450';

  config.host = 'http://cnodejs.org';

  config.session_secret = 'node_club_secret'; // 务必修改

  // add your config here
  config.middleware = [
    'locals',
    'authUser',
    'errorPage',
  ];

  config.authUser = {
    enable: true,
    match: '/',
  };

  // 是否允许直接注册（否则只能走 github 的方式）
  config.allow_sign_up = true;

  // cdn host，如 http://cnodejs.qiniudn.com
  config.site_static_host = ''; // 静态文件存储域名

  // 版块
  config.tabs = [
    [ 'share', '分享' ],
    [ 'ask', '问答' ],
    [ 'job', '招聘' ],
  ];

  // RSS配置
  config.rss = {
    title: 'CNode：Node.js专业中文社区',
    link: 'http://cnodejs.org',
    language: 'zh-cn',
    description: 'CNode：Node.js专业中文社区',
    // 最多获取的RSS Item数量
    max_rss_items: 50,
  };

  config.view = {
    defaultViewEngine: 'ejs',
    mapping: {
      '.html': 'ejs',
    },
  };

  config.ejs = {
    layout: 'layout.html',
  };

  config.avatars_allow_hostname = [
    'avatars0.githubusercontent.com',
    'avatars1.githubusercontent.com',
    'avatars2.githubusercontent.com',
    'avatars.githubusercontent.com',
    'www.gravatar.com',
    'gravatar.com',
    'www.google-analytics.com',
  ];

  config.auth_cookie_name = 'node_club';
  config.admins = {
    ADMIN_USER: true,
  };

  // 邮箱配置
  config.mail_opts = {
    host: 'smtp.163.com',
    port: 25,
    auth: {
      user: 'club@126.com',
      pass: 'club',
    },
    ignoreTLS: true,
  };

  return config;
};
