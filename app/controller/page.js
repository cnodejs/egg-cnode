'use strict';

const Controller = require('egg').Controller;

class PageController extends Controller {
  async about() {
    await this.ctx.render('static/about', { pageTitle: '关于我们' });
  }

  // FAQ
  async faq() {
    await this.ctx.render('static/faq', { pageTitle: 'FAQ' });
  }

  async getstart() {
    await this.ctx.render('static/getstart', { pageTitle: 'Node.js 新手入门' });
  }

  async robots() {
    this.ctx.type = 'text';
    this.ctx.body = `
  # See http://www.robotstxt.org/robotstxt.html for documentation on how to use the robots.txt file
  #
  # To ban all spiders from the entire site uncomment the next two lines:
  # User-Agent: *
  # Disallow: /
`;
  }

  async api() {
    await this.ctx.render('static/api', { pageTitle: 'API' });
  }

}

module.exports = PageController;
