'use strict';

const path = require('path');

module.exports = appInfo => {

  const config = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1519887194138_3450';

  // add your config here
  config.middleware = ['locals'];
  // cdn host，如 http://cnodejs.qiniudn.com
  config.site_static_host = ''; // 静态文件存储域名

  config.mongodb = 'mongodb://127.0.0.1/node_club_test';

  // redis 配置，默认是本地
  config.redis = {
    port: 6379,
    host: '127.0.0.1',
    db: 0,
    password: '',
  };

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
