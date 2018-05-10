'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  require('./router/web')(app);
  require('./router/api')(app);
};

