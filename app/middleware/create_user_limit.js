'use strict';

const moment = require('moment');

module.exports = limitCount => {

  return async function createUserLimit(ctx, next) {
    const { service } = ctx;
    const realIP = ctx.headers['x-real-ip'];
    if (!realIP) {
      throw new Error('should provice `x-real-ip` header');
    }

    const YYYYMMDD = moment().format('YYYYMMDD');
    const key = `user_count_${realIP}_${YYYYMMDD}`;

    let todayTopicsCount = (await service.cache.get(key)) || 0;
    if (todayTopicsCount >= limitCount) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error_msg: '频率限制：当前操作每天可以进行 ' + limitCount + ' 次',
      };
      return;
    }

    await next();

    if (ctx.status === 302) {
      // 新建话题成功
      todayTopicsCount += 1;
      await service.cache.incr(key, 60 * 60 * 24);
      ctx.set('X-RateLimit-Limit', limitCount);
      ctx.set('X-RateLimit-Remaining', limitCount - todayTopicsCount);
    }
  };
};

