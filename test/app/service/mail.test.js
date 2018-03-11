'use strict';

const { app } = require('egg-mock/bootstrap');

describe('test/app/service/mail.test.js', () => {
  describe('sendActiveMail', () => {
    it('should ok', async () => {
      const ctx = app.mockContext();
      await ctx.service.mail.sendActiveMail('sinchang@foxmail.com', 'token', 'sinchang');
    });
  });

  describe('sendResetPassMail', function() {
    it('should ok', async () => {
      const ctx = app.mockContext();
      await ctx.service.mail.sendResetPassMail('sinchang@foxmail.com', 'token', 'sinchang');
    });
  });
});
