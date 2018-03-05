'use strict';

exports.redis = {
  client: {
    host: '127.0.0.1',
    port: 6379,
    password: '',
    db: 0,
  },
};

exports.mongoose = {
  url: 'mongodb://127.0.0.1/node_club_test',
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
