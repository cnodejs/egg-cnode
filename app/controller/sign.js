'use strict';

const Controller = require('egg').Controller;

class SignController extends Controller {
  async showLogin() {
    const { ctx } = this;
    const locals = {};
    await ctx.render('/sign/signin', locals);
  }

  async signup() {
    this.ctx.render('sign/signup');
  }

  async signout() {
    const { ctx } = this;
    ctx.session = null;
    ctx.logout();
    ctx.body = 'signout';
  }
}

module.exports = SignController;
