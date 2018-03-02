'use strict';

const BaseModel = require('../common/base_model');

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.ObjectId;

  const MessageSchema = new Schema({
    type: { type: String },
    master_id: { type: ObjectId },
    author_id: { type: ObjectId },
    topic_id: { type: ObjectId },
    reply_id: { type: ObjectId },
    has_read: { type: Boolean, default: false },
    create_at: { type: Date, default: Date.now },
  });

  MessageSchema.plugin(BaseModel);
  MessageSchema.index({ master_id: 1, has_read: -1, create_at: -1 });

  return mongoose.model('Message', MessageSchema);
};
