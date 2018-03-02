'use strict';

exports.redis = {
  client: {
    host: '127.0.0.1',
    port: 6379,
    password: '',
    db: 0,
  },
};

/**
 * @see http://mongodb.github.io/node-mongodb-native/2.2/api/Db.html#createCollection
 */
exports.mongoose = {
  url: 'mongodb://127.0.0.1/node_club_test',
  options: {
    server: { poolSize: 20 },
  },
};
