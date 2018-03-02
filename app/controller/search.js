'use strict';

const Controller = require('egg').Controller;

class SearchController extends Controller {
  async index() {
    let q = this.ctx.query.q;
    q = encodeURIComponent(q);
    this.ctx.redirect(`https://www.google.com.hk/#hl=zh-CN&q=site:cnodejs.org+${q}`);
  }
}

module.exports = SearchController;
