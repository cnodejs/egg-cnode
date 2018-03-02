'use strict';

const path = require('path');

const loader = require('loader-koa');

module.exports = (options, app) => {
  return loader.less(path.join(app.baseDir, 'app'));
};
