'use strict';

const moment = require('moment');

module.exports = limit => {

  return async function createUserLimit(ctx, next) {
    const { service } = ctx;
    const realIP = ctx.ip;

    const YYYYMMDD = moment().format('YYYYMMDD');
    const key = `user_count_${realIP}_${YYYYMMDD}`;

    let count = (await service.cache.get(key)) || 0;
    if (count >= limit) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        error_msg: '频率限制：当前操作每天可以进行 ' + limit + ' 次',
      };
      return;
    }

    await next();

    if (ctx.status === 302) {
      // 新建话题成功
      count += 1;
      await service.cache.incr(key, 60 * 60 * 24);
      ctx.set('X-RateLimit-Limit', limit);
      ctx.set('X-RateLimit-Remaining', limit - count);
    }
  };
};

