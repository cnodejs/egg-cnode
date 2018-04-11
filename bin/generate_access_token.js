'use strict';

// 一次性脚本
// 为所有老用户生成 accessToken

const uuid = require('uuid');
const mongoose = require('mongoose');
const config = require('../config/config.prod.js')({});
const UserModel = require('../app/model/user')({
  mongoose,
});

mongoose.connect(config.mongoose.url, function(err) {
  if (err) {
    console.error('connect to %s error: ', config.mongoose, err.message);
    process.exit(1);
  }
});

async function main() {
  const users = await UserModel.find({
    accessToken: {
      $exists: false,
    },
  });
  // console.log(users);
  for (const user of users) {
    user.accessToken = uuid.v4();
    await user.save();
  }
}

main();
