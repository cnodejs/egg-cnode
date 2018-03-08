'use strict';

const { sendActiveMail, sendResetPassMail } = require('../../../app/common/mail');

describe('test/app/common/mail.js', () => {
  describe('sendActiveMail', () => {
    it('should ok', () => {
      sendActiveMail('sinchang@foxmail.com', 'token', 'sinchang');
    });
  });

  describe('sendResetPassMail', function() {
    it('should ok', () => {
      sendResetPassMail('sinchang@foxmail.com', 'token', 'sinchang');
    });
  });
});
