'use strict';

const Service = require('egg').Service;

class SearchService extends Service {
  constructor(app) {
    super(app);
    this.limit = this.config.list_topic_count;
  }

  /*
   * 根据关键字查询本地数据库
   */
  async searchLocal(query, keyword) {
    const { tab } = query;
    const page = parseInt(query.page) || 1;
    let users = [];
    let topics = [];
    let data = [];
    let count = this.limit;

    switch (tab) {
      case 'user':
        [ data, count ] = await this.searchUser(keyword, page);
        break;
      case 'topic':
        [ data, count ] = await this.searchTopic(keyword, page);
        break;
      default:
        [ users, topics ] = await this.searchUserAndTopic(keyword, page);
    }

    const pages = Math.ceil(count / this.limit);
    return {
      keyword,
      data,
      users,
      topics,
      current_page: parseInt(query.page) || 1,
      tab,
      pages,
      base: '/search?q=' + keyword,
    };
  }

  queryFactory(keyword, searchKey, page) {
    const opt = { skip: (page - 1) * this.limit, limit: this.limit, sort: '-create_at' };
    return [
      { [searchKey]: { $regex: new RegExp(keyword, 'i') } },
      opt,
    ];
  }

  /*
   * 根据关键字查找用户列表
   * @param {String} keyword 关键字, {Number} page 第几页
   * @return {Promise[data, count]} 承载用户列表, 查询总数的 Promise 对象
   */
  searchUser(keyword, page) {
    const searchQuery = this.queryFactory(keyword, 'name', page);
    return Promise.all([
      this.service.user.getUsersByQuery(...searchQuery),
      this.service.user.getCountByQuery(...searchQuery),
    ]);
  }

  /*
   * 根据关键字查找帖子列表
   * @param {String} keyword 关键字, {Number} page 第几页
   * @return {Promise[data, count]} 承载帖子列表, 查询总数的 Promise 对象
   */
  searchTopic(keyword, page) {
    const searchQuery = this.queryFactory(keyword, 'title', page);
    return Promise.all([
      this.service.topic.getTopicsByQuery(...searchQuery),
      this.service.topic.getCountByQuery(...searchQuery),
    ]);
  }

  /*
   * 根据关键字查找用户和帖子列表
   * @param {String} keyword 关键字, {Number} page 第几页
   * @return {Promise[data, count]} 承载用户列表, 帖子列表的 Promise 对象
   */
  searchUserAndTopic(keyword, page) {
    const userQuery = this.queryFactory(keyword, 'name', page);
    const topicQuery = this.queryFactory(keyword, 'title', page);
    return Promise.all([
      this.service.user.getUsersByQuery(...userQuery),
      this.service.topic.getTopicsByQuery(...topicQuery),
    ]);
  }
}

module.exports = SearchService;
