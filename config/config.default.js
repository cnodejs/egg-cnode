'use strict';

const path = require('path');

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

  config.view = {
    root: path.join(appInfo.baseDir, 'app/view'),
    defaultViewEngine: 'ejs',
    mapping: {
      '.html': 'ejs',
    },
  };

  config.ejs = {};

  return config;
};
