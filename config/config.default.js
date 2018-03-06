'use strict';

module.exports = appInfo => {
  const config = {};

  // debug 为 true 时，用于本地调试
  config.debug = true;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1519887194138_3450';

  // add your config here
  config.middleware = [
    'locals',
    'authUser',
  ];

  config.authUser = {
    enable: true,
    match: '/',
  };

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

  return config;
};
