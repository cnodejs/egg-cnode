'use strict';

const { sendActiveMail, sendResetPassMail } = require('../../../app/common/mail');

describe('test/app/common/mail.js', () => {
  describe('sendActiveMail', function() {
    it('should ok', function() {
      sendActiveMail('sinchang@foxmail.com', 'token', 'sinchang');
    });
  });

  describe('sendResetPassMail', function() {
    it('should ok', function() {
      sendResetPassMail('sinchang@foxmail.com', 'token', 'sinchang');
    });
  });
});
