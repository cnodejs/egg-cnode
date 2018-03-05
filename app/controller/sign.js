'use strict';

const Controller = require('egg').Controller;

class SignController extends Controller {
  async showLogin() {
    const { ctx } = this;
    const data = {};
    const options = {
      layout: 'layout.html',
    };
    console.log(ctx.session);
    await ctx.render('/sign/signin', data, options);
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
