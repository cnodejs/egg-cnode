'use strict';

const utility = require('utility');
const uuid = require('uuid');
const mongoose = require('mongoose');

const BaseModel = require('../models/base_model');
const Schema = mongoose.Schema;

module.exports = app => {

  const UserSchema = new Schema({
    name: { type: String },
    loginname: { type: String },
    pass: { type: String },
    email: { type: String },
    url: { type: String },
    profile_image_url: { type: String },
    location: { type: String },
    signature: { type: String },
    profile: { type: String },
    weibo: { type: String },
    avatar: { type: String },
    githubId: { type: String },
    githubUsername: { type: String },
    githubAccessToken: { type: String },
    is_block: { type: Boolean, default: false },

    score: { type: Number, default: 0 },
    topic_count: { type: Number, default: 0 },
    reply_count: { type: Number, default: 0 },
    follower_count: { type: Number, default: 0 },
    following_count: { type: Number, default: 0 },
    collect_tag_count: { type: Number, default: 0 },
    collect_topic_count: { type: Number, default: 0 },
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now },
    is_star: { type: Boolean },
    level: { type: String },
    active: { type: Boolean, default: false },

    receive_reply_mail: { type: Boolean, default: false },
    receive_at_mail: { type: Boolean, default: false },
    from_wp: { type: Boolean },

    retrieve_time: { type: Number },
    retrieve_key: { type: String },

    accessToken: { type: String },
  });

  UserSchema.plugin(BaseModel);

  UserSchema.virtual('avatar_url').get(function() {
    let url = this.avatar || ('https://gravatar.com/avatar/' + utility.md5(this.email.toLowerCase()) + '?size=48');

    // www.gravatar.com 被墙
    url = url.replace('www.gravatar.com', 'gravatar.com');

    // 让协议自适应 protocol，使用 `//` 开头
    if (url.indexOf('http:') === 0) {
      url = url.slice(5);
    }

    // 如果是 github 的头像，则限制大小
    if (url.indexOf('githubusercontent') !== -1) {
      url += '&s=120';
    }

    return url;
  });

  UserSchema.virtual('isAdvanced').get(function() {
    // 积分高于 700 则认为是高级用户
    return this.score > 700 || this.is_star;
  });

  UserSchema.index({ loginname: 1 }, { unique: true });
  UserSchema.index({ email: 1 }, { unique: true });
  UserSchema.index({ score: -1 });
  UserSchema.index({ githubId: 1 });
  UserSchema.index({ accessToken: 1 });

  UserSchema.pre('save', function(next) {
    const now = new Date();
    this.update_at = now;
    next();
  });

  const User = mongoose.model('User', UserSchema);

  class UserService extends app.Service {
    /*
     * 根据用户名列表查找用户列表
     * @param {Array} names 用户名列表
     * @return {Promise[users]} 承载用户列表的 Promise 对象
     */
    async getUsersByNames(names) {
      if (names.length === 0) {
        return [];
      }

      return User.find({ loginname: { $in: names } }).exec();
    }

    /*
     * 根据登录名查找用户
     * @param {String} loginName 登录名
     * @return {Promise[user]} 承载用户的 Promise 对象
     */
    getUserByLoginName(loginName) {
      const query = { loginname: new RegExp('^' + loginName + '$', 'i') };
      return User.findOne(query).exec();
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

      return User.findOne({ _id: id }).exec();
    }

    /*
     * 根据邮箱，查找用户
     * @param {String} email 邮箱地址
     * @return {Promise[user]} 承载用户的 Promise 对象
     */
    getUserByMail(email) {
      return User.findOne({ email }).exec();
    }

    /*
     * 根据用户ID列表，获取一组用户
     * @param {Array} ids 用户ID列表
     * @return {Promise[users]} 承载用户列表的 Promise 对象
     */
    getUsersByIds(ids) {
      return User.find({ _id: { $in: ids } }).exec();
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
      return User.find(query, '', opt).exec();
    }

    /*
     * 根据查询条件，获取一个用户
     * Callback:
     * - err, 数据库异常
     * - user, 用户
     * @param {String} name 用户名
     * @param {String} key 激活码
     * @return {Promise[users]} 承载用户列表的 Promise 对象
     */
    getUserByNameAndKey(loginname, key) {
      return User.findOne({ loginname, retrieve_key: key }).exec();
    }

    newAndSave(name, loginname, pass, email, avatar_url, active) {
      const user = new User();
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
      return 'http://www.gravatar.com/avatar/' + utility.md5(email.toLowerCase()) + '?size=48';
    }

    getGravatar(user) {
      return user.avatar || this.makeGravatar(user);
    }
  }

  return UserService;
};
