'use strict';

module.exports = app => {
  const redis = app.redisClient;
  const logger = app.logger;

  return class extends app.Service {
    get(key) {
      return new Promise((resolve, reject) => {
        const t = Date.now();
        redis.get(key, (err, data) => {
          if (err) {
            return reject(err);
          }
          if (!data) {
            return resolve();
          }
          data = JSON.parse(data);
          const duration = (Date.now() - t);
          logger.debug('Cache', 'get', key, (duration + 'ms').green);
          resolve(data);
        });
      });
    }

    setex(key, value, time) {
      return new Promise((resolve, reject) => {
        const t = Date.now();
        value = JSON.stringify(value);

        redis.setex(key, time, value, (err) => {
          if (err) {
            return reject(err);
          }
          const duration = (Date.now() - t);
          logger.debug('Cache', 'set', key, (duration + 'ms').green);
          resolve();
        });
      });
    }
  };
};
