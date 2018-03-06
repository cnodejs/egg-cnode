'use strict';

const Controller = require('egg').Controller;

const convert = require('data2xml')();

function utf8ForXml(inputStr) {
  // FIXME: no-control-regex
  /* eslint-disable no-control-regex */
  return inputStr.replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '');
}

class RSSController extends Controller {
  async index() {
    const config = this.config;
    if (!config.rss) {
      this.ctx.status = 404;
      this.ctx.body = 'Please set `rss` in config.js';
      return;
    }

    this.ctx.type = 'xml';
    const rss = await this.service.cache.get('rss');
    if (!this.config.debug && rss) {
      this.ctx.body = rss;
      return;
    }

    const opt = {
      limit: config.rss.max_rss_items,
      sort: '-create_at',
    };
    const query = { tab: { $nin: [ 'dev' ] } };
    const topics = await this.service.topic.getTopicsByQuery(query, opt);
    const rss_obj = {
      _attr: { version: '2.0' },
      channel: {
        title: config.rss.title,
        link: config.rss.link,
        language: config.rss.language,
        description: config.rss.description,
        item: [],
      },
    };

    topics.forEach(topic => {
      rss_obj.channel.item.push({
        title: topic.title,
        link: config.rss.link + '/topic/' + topic._id,
        guid: config.rss.link + '/topic/' + topic._id,
        description: this.ctx.helper.markdown(topic.content),
        author: topic.author.loginname,
        pubDate: topic.create_at.toUTCString(),
      });
    });

    let rssContent = convert('rss', rss_obj);
    rssContent = utf8ForXml(rssContent);
    await this.service.cache.setex('rss', rssContent, 60 * 5); // 五分钟
    this.ctx.body = rssContent;
  }
}

module.exports = RSSController;
