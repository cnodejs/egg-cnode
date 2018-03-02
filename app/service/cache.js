'use strict';

const Service = require('egg').Service;

class CacheService extends Service {
  async get(key) {
    const { redis, logger } = this.app;

    try {
      const t = Date.now();
      let data = await redis.get(key);
      if (!data) return;

      data = JSON.parse(data);
      const duration = Date.now() - t;
      logger.debug('Cache', 'get', key, (duration + 'ms').green);
      return data;
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  async setex(key, value, seconds) {
    const { redis, logger } = this.app;
    const t = Date.now();
    value = JSON.stringify(value);

    try {
      await redis.set(key, value, 'EX', seconds);
      const duration = Date.now() - t;
      logger.debug('Cache', 'set', key, (duration + 'ms').green);      
    } catch (error) {
      logger.error(error);
    }
  }
}

module.exports = CacheService;
