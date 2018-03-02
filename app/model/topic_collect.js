'use strict';

const BaseModel = require('../common/base_model');

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.ObjectId;

  const TopicCollectSchema = new Schema({
    user_id: { type: ObjectId },
    topic_id: { type: ObjectId },
    create_at: { type: Date, default: Date.now },
  });

  TopicCollectSchema.plugin(BaseModel);
  TopicCollectSchema.index({ user_id: 1, topic_id: 1 }, { unique: true });

  return mongoose.model('TopicCollect', TopicCollectSchema);
};
