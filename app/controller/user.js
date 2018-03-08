'use strict';

const _ = require('lodash');
const utility = require('utility');
const tools = require('../common/tools');
const validator = require('validator');
const Controller = require('egg').Controller;

class UserController extends Controller {

  async index() {
    const { ctx, service, config } = this;
    const user_name = ctx.params.name;
    const user = await ctx.service.user.getUserByLoginName(user_name);
    if (!user) {
      ctx.status = 404;
      ctx.message = '这个用户不存在。';
      return;
    }

    let query = { author_id: user._id };
    const opt = { limit: 5, sort: '-create_at' };
    const [
      recent_topics, replies,
    ] = await Promise.all([
      service.topic.getTopicsByQuery(query, opt),
      service.reply.getRepliesByAuthorId(user._id, { limit: 20, sort: '-create_at' }),
    ]);

    // 只显示最近5条
    const topic_ids = [ ...new Set(replies.map(reply => reply.topic_id.toString())) ].slice(0, 5);

    query = { _id: { $in: topic_ids } };
    let recent_replies = await service.topic.getTopicsByQuery(query, {});

    recent_replies = _.sortBy(recent_replies, function(topic) {
      return topic_ids.indexOf(topic._id.toString());
    });

    user.url = (function() {
      if (user.url && user.url.indexOf('http') !== 0) {
        return 'http://' + user.url;
      }
      return user.url;
    })();

    // 如果用户没有激活，那么管理员可以帮忙激活
    let token = '';
    if (!user.active && ctx.session.user && ctx.session.user.is_admin) {
      token = utility.md5(user.email + user.pass + config.session_secret);
    }

    await ctx.render('user/index', {
      user,
      recent_topics,
      recent_replies,
      token,
      pageTitle: `@${user.loginname} 的个人主页`,
    });
  }

  async listStars() {
    const { ctx, service } = this;
    const stars = await service.user.getUsersByQuery({ is_star: true }, {});
    await ctx.render('user/stars', { stars });
  }

  async top100() {
    const { ctx, service } = this;
    const opt = { limit: 100, sort: '-score' };
    const tops = await service.user.getUsersByQuery({ is_block: false }, opt);
    await ctx.render('user/top100', {
      users: tops,
      pageTitle: 'top100',
    });
  }

  async listCollectedTopics() {
    const { ctx, service } = this;
    const name = ctx.params.name;
    const page = Number(ctx.query.page) || 1;
    const limit = this.config.list_topic_count;

    const user = await service.user.getUserByLoginName(name);

    if (!user) {
      ctx.status = 404;
      ctx.message = '这个用户不存在。';
      return;
    }

    const pages = Math.ceil(user.collect_topic_count / limit);
    const opt = {
      skip: (page - 1) * limit,
      limit,
    };

    const collects = await service.topicCollect.getTopicCollectsByUserId(user._id, opt);
    const ids = collects.map(function(doc) {
      return String(doc.topic_id);
    });
    const query = { _id: { $in: ids } };
    let topics = await service.topic.getTopicsByQuery(query, {});
    topics = _.sortBy(topics, function(topic) {
      return ids.indexOf(String(topic._id));
    });

    await ctx.render('user/collect_topics', {
      topics,
      current_page: page,
      pages,
      user,
    });
  }

  async listTopics() {
    const { ctx, service, config } = this;
    const user_name = ctx.params.name;
    const page = Number(ctx.query.page) || 1;
    const limit = config.list_topic_count;

    const user = await service.user.getUserByLoginName(user_name);

    if (!user) {
      ctx.status = 404;
      ctx.message = '这个用户不存在。';
      return;
    }

    const query = { author_id: user._id };
    const opt = { skip: (page - 1) * limit, limit, sort: '-create_at' };
    const [ topics, all_topics_count ] = await Promise.all([
      service.topic.getTopicsByQuery(query, opt),
      service.topic.getCountByQuery(query),
    ]);
    const pages = Math.ceil(all_topics_count / limit);

    await ctx.render('user/topics', {
      user,
      topics,
      current_page: page,
      pages,
    });
  }

  async listReplies() {
    const { ctx, service } = this;
    const user_name = ctx.params.name;
    const page = Number(ctx.query.page) || 1;
    const limit = 50;

    const user = await service.user.getUserByLoginName(user_name);
    if (!user) {
      ctx.status = 404;
      ctx.message = '这个用户不存在。';
      return;
    }

    const opt = { skip: (page - 1) * limit, limit, sort: '-create_at' };
    const replies = await service.reply.getRepliesByAuthorId(user._id, opt);
    const topic_ids = [ ...new Set([ ...replies.map(function(reply) {
      return reply.topic_id.toString();
    }) ]) ];
    // 获取所有有评论的主题
    const query = { _id: { $in: topic_ids } };
    let topics = await service.topic.getTopicsByQuery(query, {});
    topics = _.sortBy(topics, function(topic) {
      return topic_ids.indexOf(topic._id.toString());
    });
    const count = await service.reply.getCountByAuthorId(user._id);
    const pages = Math.ceil(count / limit);

    await ctx.render('user/replies', {
      user,
      topics,
      current_page: page,
      pages,
    });
  }

  async showSetting() {
    const { ctx, service } = this;
    const id = ctx.session.user._id;
    const user = await service.user.getUserById(id);

    if (!user) {
      ctx.status = 404;
      ctx.message = '发生错误';
      return;
    }

    if (ctx.request.query.save === 'success') {
      user.success = '保存成功。';
    }

    return await ctx.render('user/setting', { user });
  }

  async setting() {
    const { ctx, ctx: { request: req }, service } = this;
    // 显示出错或成功信息
    async function showMessage(msg, data, isSuccess) {
      data = data || req.body;
      const user = {
        loginname: data.loginname,
        email: data.email,
        url: data.url,
        location: data.location,
        signature: data.signature,
        weibo: data.weibo,
        accessToken: data.accessToken,
      };
      if (isSuccess) {
        user.success = msg;
      } else {
        user.error = msg;
      }
      return await ctx.render('user/setting', { user });
    }

    // post
    const { body, body: { action } } = req;
    if (action === 'change_setting') {
      const url = validator.trim(body.url);
      const location = validator.trim(body.location);
      const weibo = validator.trim(body.weibo);
      const signature = validator.trim(body.signature);

      const user = await service.user.getUserById(ctx.session.user._id);
      user.url = url;
      user.location = location;
      user.signature = signature;
      user.weibo = weibo;
      user.save();

      ctx.session.user = user.toObject({ virtual: true });
      return ctx.redirect('/setting?save=success');
    }

    if (action === 'change_password') {
      const oldPass = validator.trim(req.body.old_pass);
      const newPass = validator.trim(req.body.new_pass);
      if (!oldPass || !newPass) {
        return showMessage('旧密码或新密码不得为空');
      }

      const user = await service.user.getUserById(ctx.session.user._id);
      const equal = tools.bcompare(oldPass, user.pass);
      if (!equal) {
        return showMessage('当前密码不正确。', user);
      }

      const newPassHash = tools.bhash(newPass);
      user.pass = newPassHash;
      user.save();
      return showMessage('密码已被修改。', user, true);
    }
  }

  async toggleStar() {
    const { ctx, ctx: { request: req }, service } = this;
    const { body } = req;
    const user_id = body.user_id;
    const user = await service.user.getUserById(user_id);

    if (!user) {
      ctx.status = 404;
      ctx.message = 'user is not exists';
      return;
    }
    user.is_star = !user.is_star;
    user.save();

    ctx.body = { status: 'success' };
  }

  async block() {
    const { ctx, ctx: { request: req }, service } = this;
    const { body: { action } } = req;
    const loginname = ctx.params.name;

    const user = await service.user.getUserByLoginName(loginname);
    if (!user) {
      ctx.status = 404;
      ctx.message = 'user is not exists';
      return;
    }

    if (action === 'set_block') {
      user.is_block = true;
      user.save();
      ctx.body = { status: 'success' };
    } else if (action === 'cancel_block') {
      user.is_block = false;
      user.save();
      ctx.body = { status: 'success' };
    }
  }

  async deleteAll() {
    const { ctx, service } = this;
    const loginname = ctx.params.name;


    const user = await service.user.getUserByLoginName(loginname);
    if (!user) {
      ctx.status = 404;
      ctx.message = 'user is not exists';
      return;
    }

    // 删除主题
    ctx.model.Topic.update({ author_id: user._id }, { $set: { deleted: true } }, { multi: true });
    // 删除评论
    ctx.model.Reply.update({ author_id: user._id }, { $set: { deleted: true } }, { multi: true });
    // 点赞数也全部干掉
    ctx.model.Reply.update({}, { $pull: { ups: user._id } }, { multi: true });
    ctx.body = { status: 'success' };
  }
}

// var User         = require('../proxy').User;
// var Topic        = require('../proxy').Topic;
// var Reply        = require('../proxy').Reply;
// var TopicCollect = require('../proxy').TopicCollect;
// var utility      = require('utility');
// var util         = require('util');
// var TopicModel   = require('../models').Topic;
// var ReplyModel   = require('../models').Reply;
// var tools        = require('../common/tools');
// var config       = require('../config');
// var EventProxy   = require('eventproxy');
// var validator    = require('validator');
// var _            = require('lodash');


// exports.showSetting = function (req, res, next) {
//   User.getUserById(req.session.user._id, function (err, user) {
//     if (err) {
//       return next(err);
//     }
//     if (req.query.save === 'success') {
//       user.success = '保存成功。';
//     }
//     user.error = null;
//     return res.render('user/setting', user);
//   });
// };

// exports.setting = function (req, res, next) {
//   var ep = new EventProxy();
//   ep.fail(next);

//   // 显示出错或成功信息
//   function showMessage(msg, data, isSuccess) {
//     data = data || req.body;
//     var data2 = {
//       loginname: data.loginname,
//       email: data.email,
//       url: data.url,
//       location: data.location,
//       signature: data.signature,
//       weibo: data.weibo,
//       accessToken: data.accessToken,
//     };
//     if (isSuccess) {
//       data2.success = msg;
//     } else {
//       data2.error = msg;
//     }
//     res.render('user/setting', data2);
//   }

//   // post
//   var action = req.body.action;
//   if (action === 'change_setting') {
//     var url = validator.trim(req.body.url);
//     var location = validator.trim(req.body.location);
//     var weibo = validator.trim(req.body.weibo);
//     var signature = validator.trim(req.body.signature);

//     User.getUserById(req.session.user._id, ep.done(function (user) {
//       user.url = url;
//       user.location = location;
//       user.signature = signature;
//       user.weibo = weibo;
//       user.save(function (err) {
//         if (err) {
//           return next(err);
//         }
//         req.session.user = user.toObject({virtual: true});
//         return res.redirect('/setting?save=success');
//       });
//     }));
//   }
//   if (action === 'change_password') {
//     var old_pass = validator.trim(req.body.old_pass);
//     var new_pass = validator.trim(req.body.new_pass);
//     if (!old_pass || !new_pass) {
//       return res.send('旧密码或新密码不得为空');
//     }

//     User.getUserById(req.session.user._id, ep.done(function (user) {
//       tools.bcompare(old_pass, user.pass, ep.done(function (bool) {
//         if (!bool) {
//           return showMessage('当前密码不正确。', user);
//         }

//         tools.bhash(new_pass, ep.done(function (passhash) {
//           user.pass = passhash;
//           user.save(function (err) {
//             if (err) {
//               return next(err);
//             }
//             return showMessage('密码已被修改。', user, true);

//           });
//         }));
//       }));
//     }));
//   }

// exports.toggleStar = function (req, res, next) {
//   var user_id = req.body.user_id;
//   User.getUserById(user_id, function (err, user) {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       return next(new Error('user is not exists'));
//     }
//     user.is_star = !user.is_star;
//     user.save(function (err) {
//       if (err) {
//         return next(err);
//       }
//       res.json({ status: 'success' });
//     });
//   });
// }

// exports.block = function (req, res, next) {
//   var loginname = req.params.name;
//   var action = req.body.action;

//   var ep = EventProxy.create();
//   ep.fail(next);

//   User.getUserByLoginName(loginname, ep.done(function (user) {
//     if (!user) {
//       return next(new Error('user is not exists'));
//     }
//     if (action === 'set_block') {
//       ep.all('block_user',
//         function (user) {
//           res.json({status: 'success'});
//         });
//       user.is_block = true;
//       user.save(ep.done('block_user'));

//     } else if (action === 'cancel_block') {
//       user.is_block = false;
//       user.save(ep.done(function () {

//         res.json({status: 'success'});
//       }));
//     }
//   }));
// };

// exports.deleteAll = function (req, res, next) {
//   var loginname = req.params.name;

//   var ep = EventProxy.create();
//   ep.fail(next);

//   User.getUserByLoginName(loginname, ep.done(function (user) {
//     if (!user) {
//       return next(new Error('user is not exists'));
//     }
//     ep.all('del_topics', 'del_replys', 'del_ups',
//       function () {
//         res.json({status: 'success'});
//       });
//     // 删除主题
//     TopicModel.update({author_id: user._id}, {$set: {deleted: true}}, {multi: true}, ep.done('del_topics'));
//     // 删除评论
//     ReplyModel.update({author_id: user._id}, {$set: {deleted: true}}, {multi: true}, ep.done('del_replys'));
//     // 点赞数也全部干掉
//     ReplyModel.update({}, {$pull: {'ups': user._id}}, {multi: true}, ep.done('del_ups'));
//   }));
// };

module.exports = UserController;
