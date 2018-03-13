'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.ObjectId;

  const ReplySchema = new Schema({
    content: { type: String },
    topic_id: { type: ObjectId },
    author_id: { type: ObjectId },
    reply_id: { type: ObjectId },
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date, default: Date.now },
    content_is_html: { type: Boolean },
    ups: [ Schema.Types.ObjectId ],
    deleted: { type: Boolean, default: false },
  }, {
    usePushEach: true,
  });

  ReplySchema.index({ topic_id: 1 });
  ReplySchema.index({ author_id: 1, create_at: -1 });

  return mongoose.model('Reply', ReplySchema);
};
