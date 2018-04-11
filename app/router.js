'use strict';

const web = require('./web_router');
const api = require('./api_router');

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  web(app);
  api(app);
};
