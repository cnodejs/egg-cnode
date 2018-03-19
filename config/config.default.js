'use strict';
const path = require('path');

module.exports = appInfo => {
  const config = {};

  config.name = 'CNode技术社区';

  config.description = 'CNode：Node.js专业中文社区';

  config.site_logo = '/public/images/cnodejs_light.svg';

  // debug 为 true 时，用于本地调试
  config.debug = true;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1519887194138_3450';

  config.host = 'http://cnodejs.org';

  config.session_secret = 'node_club_secret'; // 务必修改

  // add your config here
  config.middleware = [ 'locals', 'authUser', 'blockUser', 'errorPage' ];

  config.authUser = {
    enable: true,
    match: '/',
  };

  // 是否允许直接注册（否则只能走 github 的方式）
  config.allow_sign_up = true;

  // cdn host，如 http://cnodejs.qiniudn.com
  config.site_static_host = ''; // 静态文件存储域名

  // 版块
  config.tabs = [[ 'share', '分享' ], [ 'ask', '问答' ], [ 'job', '招聘' ]];

  // RSS配置
  config.rss = {
    title: 'CNode：Node.js专业中文社区',
    link: 'http://cnodejs.org',
    language: 'zh-cn',
    description: 'CNode：Node.js专业中文社区',
    // 最多获取的RSS Item数量
    max_rss_items: 50,
  };

  // 下面两个配置都是文件上传的配置

  // 7牛的access信息，用于文件上传
  config.qn_access = {
    accessKey: 'your access key',
    secretKey: 'your secret key',
    bucket: 'your bucket name',
    origin: 'http://your qiniu domain',
    // 如果vps在国外，请使用 http://up.qiniug.com/ ，这是七牛的国际节点
    // 如果在国内，此项请留空
    uploadURL: 'http://xxxxxxxx',
  };

  // 文件上传配置
  // 注：如果填写 qn_access，则会上传到 7牛，以下配置无效
  config.upload = {
    path: path.join(__dirname, 'public/upload/'),
    url: '/public/upload/',
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

  // database
  config.redis = {
    client: {
      host: process.env.EGG_REDIS_HOST || '127.0.0.1',
      port: process.env.EGG_REDIS_PORT || 6379,
      password: process.env.EGG_REDIS_PASSWORD || '',
      db: process.env.EGG_REDIS_DB || '0',
    },
  };

  /**
   * @see http://mongodb.github.io/node-mongodb-native/2.2/api/Db.html#createCollection
   */
  config.mongoose = {
    url: process.env.EGG_MONGODB_URL || 'mongodb://127.0.0.1:27017/egg_cnode',
    options: {
      server: { poolSize: 20 },
    },
  };

  // passport
  config.passportGithub = {
    key: process.env.EGG_PASSPORT_GITHUB_CLIENT_ID || 'test',
    secret: process.env.EGG_PASSPORT_GITHUB_CLIENT_SECRET || 'test',
  };

  config.passportLocal = {
    usernameField: 'name',
    passwordField: 'pass',
  };

  // 邮箱配置
  config.mail_opts = {
    host: 'smtp.126.com',
    port: 25,
    auth: {
      user: 'club@126.com',
      pass: 'club',
    },
    ignoreTLS: true,
  };

  config.alinode = {
    // 从 `Node.js 性能平台` 获取对应的接入参数
    appid: process.env.EGG_ALINODE_APPID || '',
    secret: process.env.EGG_ALINODE_SECRET || '',
  };

  config.topic = {
    perDayPerUserLimitCount: 10,
  };

  config.list_topic_count = 20;

  // 每个 IP 每天可创建用户数
  config.create_user_per_ip = 1000;

  return config;
};
