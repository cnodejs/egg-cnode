'use strict';

const mongoose = require('mongoose');

const MONGODB = Symbol('Application#mongodb');
const REDIS = Symbol('Application#redis');

// 扩展一些框架便利的方法
module.exports = {
  /**
   * 创建 mongodb 客户端连接
   */
  get mongodbClient() {
    const logger = this.logger;
    const config = this.config;

    if (!this[MONGODB]) {
      const opts = {
        server: { poolSize: 20 },
      };
      mongoose.connect(config.mongodb, opts, err => {
        if (err) {
          logger.error(err);
        }
      });
      this[MONGODB] = mongoose;
    }

    return this[MONGODB];
  },
};
