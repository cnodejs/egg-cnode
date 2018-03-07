'use strict';

const promisify = require('util').promisify;
const qn = require('qn');
const qn_access = require('../../config/config.default').qn_access;

// 7牛 client
let qnClient = null;
if (qn_access && qn_access.secretKey !== 'your secret key') {
  qnClient = qn.create(qn_access);
}

const upload = promisify(qnClient.upload);

module.exports = upload;
