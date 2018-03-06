'use strict';

exports.redis = {
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
exports.mongoose = {
  url: process.env.EGG_MONGODB_URL || 'mongodb://127.0.0.1:27017/egg_cnode',
  options: {
    server: { poolSize: 20 },
  },
};

exports.passportGithub = {
  key: process.env.EGG_PASSPORT_GITHUB_CLIENT_ID || '',
  secret: process.env.EGG_PASSPORT_GITHUB_CLIENT_SECRET || '',
};

exports.passportLocal = {
  usernameField: 'name',
  passwordField: 'pass',
};
