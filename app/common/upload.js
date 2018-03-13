'use strict';

const util = require('util');
const qn = require('qn');

module.exports = function qnUpload(options) {
  // 7牛 client
  let qnClient;
  if (options.qn_access && options.qn_access.secretKey !== 'your secret key') {
    qnClient = qn.create(options.qn_access);
  }
  return util.promisify(qnClient.upload);
};
