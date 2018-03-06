'use strict';

const moment = require('moment');
const xmlbuilder = require('xmlbuilder');
const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    let page = parseInt(this.ctx.query.page, 10) || 1;
    page = page > 0 ? page : 1;
    const tab = this.ctx.query.tab || 'all';

    // 取主题
    const query = {};
    if (!tab || tab === 'all') {
      query.tab = {
        $nin: [
          'job',
          'dev',
        ],
      };
    } else {
      if (tab === 'good') {
        query.good = true;
      } else {
        query.tab = tab;
      }
    }
    if (!query.good) {
      query.create_at = {
        $gte: moment()
          .subtract(1, 'years')
          .toDate(),
      };
    }

    const limit = this.config.list_topic_count;
    const options = {
      skip: (page - 1) * limit,
      limit,
      sort: '-top -last_reply_at',
    };

    const topics = await this.service.topic.getTopicsByQuery(query, options);
    // 取排行榜上的用户
    let tops = await this.service.cache.get('tops');
    if (!tops) {
      tops = await this.service.user.getUsersByQuery(
        { is_block: false },
        { limit: 10, sort: '-score' }
      );
      await this.service.cache.setex('tops', tops, 60);
    }

    // 取0回复的主题
    let no_reply_topics = await this.service.cache.get('no_reply_topics');
    if (!no_reply_topics) {
      no_reply_topics = await this.service.topic.getTopicsByQuery(
        {
          reply_count: 0,
          tab: {
            $nin: [
              'job',
              'dev',
            ],
          },
        },
        { limit: 5, sort: '-create_at' }
      );
      await this.service.cache.setex(
        'no_reply_topics',
        no_reply_topics,
        60 * 1
      );
    }

    // 取分页数据
    const pagesCacheKey = JSON.stringify(query) + 'pages';
    let pages = await this.service.cache.get(pagesCacheKey);
    if (!pages) {
      const all_topics_count = await this.service.topic.getCountByQuery(query);
      pages = Math.ceil(all_topics_count / limit);
      await this.service.cache.setex(pagesCacheKey, pages, 60 * 1);
    }

    const tabName = this.ctx.helper.tabName(tab);

    const locals = {
      topics,
      current_page: page,
      list_topic_count: limit,
      tops,
      no_reply_topics,
      pages,
      tabs: this.config.tabs,
      tab,
      pageTitle: tabName && tabName + '版块',
    };

    await this.ctx.render('index', locals);
  }

  async sitemap() {
    const urlset = xmlbuilder.create('urlset', {
      version: '1.0', encoding: 'UTF-8',
    });
    urlset.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

    let sitemapData = await this.service.cache.get('sitemap');
    if (!sitemapData) {
      const topics = await this.service.topic.getLimit5w();
      topics.forEach(topic => {
        urlset.ele('url').ele('loc', 'http://cnodejs.org/topic/' + topic._id);
      });
      sitemapData = urlset.end();
      // 缓存一天
      await this.service.cache.setex('sitemap', sitemapData, 3600 * 24);
    }

    this.ctx.type = 'xml';
    this.ctx.body = sitemapData;
  }

  async appDownload() {
    this.ctx.redirect('https://github.com/soliury/noder-react-native/blob/master/README.md');
  }
}

module.exports = HomeController;
