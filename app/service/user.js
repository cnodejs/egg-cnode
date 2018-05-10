'use strict';

const utility = require('utility');
const uuid = require('uuid');
const Service = require('egg').Service;

class UserService extends Service {
  /*
   * 根据用户名列表查找用户列表
   * @param {Array} names 用户名列表
   * @return {Promise[users]} 承载用户列表的 Promise 对象
   */
  async getUsersByNames(names) {
    if (names.length === 0) {
      return [];
    }

    const query = { loginname: { $in: names } };
    return this.ctx.model.User.find(query).exec();
  }

  /*
   * 根据登录名查找用户
   * @param {String} loginName 登录名
   * @return {Promise[user]} 承载用户的 Promise 对象
   */
  getUserByLoginName(loginName) {
    const query = { loginname: new RegExp('^' + loginName + '$', 'i') };
    return this.ctx.model.User.findOne(query).exec();
  }

  /*
   * 根据 githubId 查找用户
   * @param {String} githubId 登录名
   * @return {Promise[user]} 承载用户的 Promise 对象
   */
  getUserByGithubId(githubId) {
    const query = { githubId };
    return this.ctx.model.User.findOne(query).exec();
  }

  /*
   * 根据 token 查找用户
   * @param {String} token
   * @return {Promise[user]} 承载用户的 Promise 对象
   */
  getUserByToken(accessToken) {
    const query = { accessToken };
    return this.ctx.model.User.findOne(query).exec();
  }

  /*
   * 根据用户ID，查找用户
   * @param {String} id 用户ID
   * @return {Promise[user]} 承载用户的 Promise 对象
   */
  async getUserById(id) {
    if (!id) {
      return null;
    }

    return this.ctx.model.User.findOne({ _id: id }).exec();
  }

  /*
   * 根据邮箱，查找用户
   * @param {String} email 邮箱地址
   * @return {Promise[user]} 承载用户的 Promise 对象
   */
  getUserByMail(email) {
    return this.ctx.model.User.findOne({ email }).exec();
  }

  /*
   * 根据用户ID列表，获取一组用户
   * @param {Array} ids 用户ID列表
   * @return {Promise[users]} 承载用户列表的 Promise 对象
   */
  getUsersByIds(ids) {
    return this.ctx.model.User.find({ _id: { $in: ids } }).exec();
  }

  /*
   * 根据关键字，获取一组用户
   * Callback:
   * - err, 数据库异常
   * - users, 用户列表
   * @param {String} query 关键字
   * @param {Object} opt 选项
   * @return {Promise[users]} 承载用户列表的 Promise 对象
   */
  getUsersByQuery(query, opt) {
    return this.ctx.model.User.find(query, '', opt).exec();
  }

  /*
   * 获取关键词能搜索到的用户数量
   * @param {String} query 搜索关键词
   */
  getCountByQuery(query) {
    return this.ctx.model.User.count(query).exec();
  }

  /*
   * 根据查询条件，获取一个用户
   * @param {String} name 用户名
   * @param {String} key 激活码
   * @return {Promise[user]} 承载用户的 Promise 对象
   */
  getUserByNameAndKey(loginname, key) {
    const query = { loginname, retrieve_key: key };
    return this.ctx.model.User.findOne(query).exec();
  }

  incrementScoreAndReplyCount(id, score, replyCount) {
    const query = { _id: id };
    const update = { $inc: { score, reply_count: replyCount } };
    return this.ctx.model.User.findByIdAndUpdate(query, update).exec();
  }

  incrementCollectTopicCount(id) {
    const query = { _id: id };
    const update = { $inc: { collect_topic_count: 1 } };
    return this.ctx.model.User.findByIdAndUpdate(query, update).exec();
  }

  newAndSave(name, loginname, pass, email, avatar_url, active) {
    const user = new this.ctx.model.User();
    user.name = loginname;
    user.loginname = loginname;
    user.pass = pass;
    user.email = email;
    user.avatar = avatar_url;
    user.active = active || false;
    user.accessToken = uuid.v4();

    return user.save();
  }

  makeGravatar(email) {
    return (
      'http://www.gravatar.com/avatar/' +
      utility.md5(email.toLowerCase()) +
      '?size=48'
    );
  }

  getGravatar(user) {
    return user.avatar || this.makeGravatar(user.email);
  }
}

module.exports = UserService;
