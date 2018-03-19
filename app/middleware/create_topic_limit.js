'use strict';

const moment = require('moment');

module.exports = ({ perDayPerUserLimitCount = 10 }) => {

  return async function createTopicLimit(ctx, next) {
    const { user, service } = ctx;
    const YYYYMMDD = moment().format('YYYYMMDD');
    const key = `topics_count_${user._id}_${YYYYMMDD}`;

    let todayTopicsCount = (await service.cache.get(key)) || 0;
    if (todayTopicsCount >= perDayPerUserLimitCount) {
      ctx.status = 403;
      await ctx.render('notify/notify',
        { error: `今天的话题发布数量已达到限制（${perDayPerUserLimitCount}）` });
      return;
    }

    await next();

    if (ctx.status === 302) {
      // 新建话题成功
      todayTopicsCount += 1;
      await service.cache.incr(key, 60 * 60 * 24);
      ctx.set('X-RateLimit-Limit', perDayPerUserLimitCount);
      ctx.set('X-RateLimit-Remaining', perDayPerUserLimitCount - todayTopicsCount);
    }
  };
};
