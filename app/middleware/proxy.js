'use strict';

const urllib = require('url');
// const request = require('request');
// const logger = require('../common/logger');
// const _ = require('lodash');

module.exports = () => {
  return async function proxy(ctx, next) {
    const ALLOW_HOSTNAME = [
      'avatars0.githubusercontent.com',
      'avatars1.githubusercontent.com',
      'avatars2.githubusercontent.com',
      'avatars.githubusercontent.com',
      'www.gravatar.com',
      'gravatar.com',
      'www.google-analytics.com',
    ];

    ctx.locals.proxy = avatar => {
      // const { request: req, response: res } = ctx;
      const url = decodeURIComponent(avatar);
      const hostname = urllib.parse(url).hostname;

      if (ALLOW_HOSTNAME.indexOf(hostname) === -1) {
        return;
        // return res.send(hostname + ' is not allowed');
      }

      return url;

      // request.get({
      //   url,
      //   headers: _.omit(req.headers, [ 'cookie', 'refer' ]),
      // })
      //   .on('response', function(response) {
      //     res.set(response.headers);
      //   })
      //   .on('error', function(err) {
      //     console.log(err);
      //     // logger.error(err);
      //   });
      //   .pipe(res);
    };
    await next();
  };
};
