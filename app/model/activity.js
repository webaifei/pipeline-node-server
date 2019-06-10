/*
 * 模板表 model
 * @Author: zhangaifei
 * @Date:  2019-06-06
 */

'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ActivitySchema = new Schema({
    id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    templateId: {
      type: String,
      required: true,
    },
    // 活动状态 1 上线 0 草稿
    status: {
      type: Number,
      default: 0,
    },
    createTime: {
      type: Date,
      default: Date.now,
    },
    updateTime: {
      type: Date,
      default: Date.now,
    },
    thumbnail: {
      type: String,
      default: 'https://avatars3.githubusercontent.com/u/38666040',
    },
  });

  return mongoose.model('Activity', ActivitySchema);
};
