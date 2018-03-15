'use strict';

const validator = require('validator');
const utility = require('utility');
const uuid = require('uuid');
const Controller = require('egg').Controller;

class SignController extends Controller {
  async showLogin() {
    const { ctx } = this;
    await ctx.render('/sign/signin', { pageTitle: '登录' });
  }

  // sign up
  async showSignup() {
    const { ctx } = this;
    await ctx.render('/sign/signup', { pageTitle: '注册' });
  }

  async signup() {
    const { ctx, service, config } = this;
    const loginname = validator.trim(ctx.request.body.loginname || '').toLowerCase();
    const email = validator.trim(ctx.request.body.email || '').toLowerCase();
    const pass = validator.trim(ctx.request.body.pass || '');
    const rePass = validator.trim(ctx.request.body.re_pass || '');

    let msg;
    // 验证信息的正确性
    if ([ loginname, pass, rePass, email ].some(item => {
      return item === '';
    })) {
      msg = '信息不完整。';
    } else if (loginname.length < 5) {
      msg = '用户名至少需要5个字符。';
    } else if (!ctx.helper.validateId(loginname)) {
      msg = '用户名不合法。';
    } else if (!validator.isEmail(email)) {
      msg = '邮箱不合法。';
    } else if (pass !== rePass) {
      msg = '两次密码输入不一致。';
    }
    // END 验证信息的正确性

    if (msg) {
      ctx.status = 422;
      await ctx.render('sign/signup', {
        error: msg,
        loginname,
        email,
      });
      return;
    }

    const users = await service.user.getUsersByQuery({ $or: [
      { loginname },
      { email },
    ] }, {});

    if (users.length > 0) {
      ctx.status = 422;
      await ctx.render('sign/signup', {
        error: '用户名或邮箱已被使用。',
        loginname,
        email,
      });
      return;
    }

    const passhash = ctx.helper.bhash(pass);

    // create gravatar
    const avatarUrl = service.user.makeGravatar(email);

    await service.user.newAndSave(loginname, loginname, passhash, email, avatarUrl, false);
    // 发送激活邮件
    // await service.mail.sendActiveMail(email, utility.md5(email + passhash + config.session_secret), loginname);
    await ctx.render('sign/signup', {
      success: '欢迎加入 ' + config.name + '！我们已给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的帐号。',
    });
  }

  async signout() {
    const { ctx } = this;
    ctx.session = null;
    ctx.logout();
    ctx.redirect('/');
  }

  async activeAccount() {
    const { ctx, service, config } = this;
    const key = validator.trim(ctx.query.key || '');
    const name = validator.trim(ctx.query.name || '');

    const user = await service.user.getUserByLoginName(name);
    if (!user) {
      await ctx.render('notify/notify', { error: '用户不存在' });
      return;
    }

    const passhash = user.pass;
    if (!user || utility.md5(user.email + passhash + config.session_secret) !== key) {
      await ctx.render('notify/notify', { error: '信息有误，帐号无法被激活。' });
      return;
    }

    if (user.active) {
      await ctx.render('notify/notify', { error: '帐号已经是激活状态。' });
      return;
    }

    user.active = true;
    await user.save();
    await ctx.render('notify/notify', { success: '帐号已被激活，请登录' });
  }

  async showSearchPass() {
    await this.ctx.render('sign/search_pass');
  }

  async updateSearchPass() {
    const { ctx, service } = this;
    const email = validator.trim(ctx.request.body.email).toLowerCase();
    if (!validator.isEmail(email)) {
      await this.ctx.render('sign/search_pass', {
        error: '邮箱不合法',
        email,
      });
      return;
    }

    // 动态生成retrive_key和timestamp到users collection,之后重置密码进行验证
    const retrieveKey = uuid.v4();
    const retrieveTime = Date.now();

    const user = await service.user.getUserByMail(email);
    if (!user) {
      await this.ctx.render('sign/search_pass', {
        error: '没有这个电子邮箱。',
        email,
      });
      return;
    }

    user.retrieve_key = retrieveKey;
    user.retrieve_time = retrieveTime;
    await user.save();

    // 发送重置密码邮件
    // mail.sendResetPassMail(email, retrieveKey, user.loginname);
    await this.ctx.render('notify/notify', {
      success: '我们已给您填写的电子邮箱发送了一封邮件，请在24小时内点击里面的链接来重置密码。',
    });
  }

  async resetPass() {
    const { ctx, service } = this;
    const key = validator.trim(ctx.query.key || '');
    const name = validator.trim(ctx.query.name || '');

    const user = await service.user.getUserByNameAndKey(name, key);
    if (!user) {
      ctx.status = 403;
      await this.ctx.render('notify/notify', {
        error: '信息有误，密码无法重置。',
      });
      return;
    }

    const now = Date.now();
    const oneDay = 1000 * 60 * 60 * 24;
    if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
      ctx.status = 403;
      await this.ctx.render('notify/notify', {
        error: '该链接已过期，请重新申请。',
      });
      return;
    }
    await this.ctx.render('sign/reset', { name, key });
  }

  async updatePass() {
    const { ctx, service } = this;
    const psw = validator.trim(ctx.request.body.psw) || '';
    const repsw = validator.trim(ctx.request.body.repsw) || '';
    const key = validator.trim(ctx.request.body.key) || '';
    const name = validator.trim(ctx.request.body.name) || '';

    if (psw !== repsw) {
      await this.ctx.render('sign/reset', {
        name,
        key,
        error: '两次密码输入不一致。',
      });
      return;
    }
    const user = await service.user.getUserByNameAndKey(name, key);

    if (!user) {
      await this.ctx.render('notify/notify', {
        error: '错误的激活链接',
      });
      return;
    }
    const passhash = ctx.helper.bhash(psw);
    user.pass = passhash;
    user.retrieve_key = null;
    user.retrieve_time = null;
    user.active = true; // 用户激活

    await user.save();
    await this.ctx.render('notify/notify', { success: '你的密码已重置。' });
  }
}

module.exports = SignController;
