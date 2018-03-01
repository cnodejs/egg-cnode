'use strict';

const mongoose = require('mongoose');

const BaseModel = require('../models/base_model');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

module.exports = app => {

  const TopicCollectSchema = new Schema({
    user_id: { type: ObjectId },
    topic_id: { type: ObjectId },
    create_at: { type: Date, default: Date.now },
  });

  TopicCollectSchema.plugin(BaseModel);
  TopicCollectSchema.index({ user_id: 1, topic_id: 1 }, { unique: true });

  const TopicCollect = mongoose.model('TopicCollect', TopicCollectSchema);

  return class Service extends app.Service {

    getTopicCollect(userId, topicId) {
      const query = { user_id: userId, topic_id: topicId };
      return TopicCollect.findOne(query).exec();
    }

    getTopicCollectsByUserId(userId, opt) {
      const defaultOpt = { sort: '-create_at' };
      opt = Object.assign(defaultOpt, opt);
      return TopicCollect.find({ user_id: userId }, '', opt).exec();
    }

    newAndSave(userId, topicId) {
      const topic_collect = new TopicCollect();
      topic_collect.user_id = userId;
      topic_collect.topic_id = topicId;
      return topic_collect.save();
    }

    remove(userId, topicId) {
      const query = { user_id: userId, topic_id: topicId };
      return TopicCollect.remove(query).exec();
    }
  };
};
