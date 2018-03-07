'use strict';

exports.redis = {
  client: {
    host: '127.0.0.1',
    port: 6379,
    password: 'egg_cnode',
    db: 0,
  },
};

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.2/api/Db.html#createCollection
 */
exports.mongoose = {
  url: 'mongodb://egg_cnode:egg_cnode@127.0.0.1:27017/egg_cnode',
  options: {
    server: { poolSize: 20 },
  },
};

exports.passportGithub = {
  key: process.env.EGG_PASSPORT_GITHUB_CLIENT_ID || 'test',
  secret: process.env.EGG_PASSPORT_GITHUB_CLIENT_SECRET || 'test',
};

exports.passportLocal = {
  usernameField: 'name',
  passwordField: 'pass',
};
