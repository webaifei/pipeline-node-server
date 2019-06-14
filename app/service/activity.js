/*
 * 活动页mongodb功能封装
 */

'use strict';

const DBLOG_PREFIX = '[activity-service]:';

const existCheck = (object, keysWithErrorInfo, prefix = '') => {
  const keys = Object.keys(keysWithErrorInfo);
  const errors = keys.map(key => {
    if (object[key]) {
      return true;
    }
    return new Error(`${prefix}, ${key}, ${keysWithErrorInfo[key]}`);
  }).filter(item => item instanceof Error);

  // return first error or true
  if (errors.length) {
    return errors[0];
  }
  return true;
};

module.exports = app => {
  class activity extends app.Service {
    // CRUD for Template
    async findAll({ conditions = {} } = {}) {
      const query = await app.model.Activity.find(conditions).catch(err => {
        app.logger.error(DBLOG_PREFIX, err);
        throw err;
      });
      return query;
    }
    async findOne({ conditions = {} } = {}) {
      const checkResult = existCheck(
        conditions,
        {
          id: "should not be undefined."
        },
        "findOne"
      );
      if (checkResult instanceof Error) {
        throw new Error(`${DBLOG_PREFIX} ${checkResult.toString()}`);
      }

      const query = await app.model.Activity.findOne(conditions).catch(
        err => {
          app.logger.error(DBLOG_PREFIX, err);
          throw err;
        }
      );
      return query;
    }
    async create({ payload = {} }) {
      const newActivity = new app.model.Activity(payload);
      const query = await newActivity.save().catch(err => {
        app.logger.error(DBLOG_PREFIX, err);
        throw err;
      });
      return query;
    }
    async update({ conditions = {}, payload = {} }) {
      const checkResult = existCheck(
        conditions,
        {
          id: "should not be undefined."
        },
        "udpate"
      );
      if (checkResult instanceof Error) {
        throw new Error(`${DBLOG_PREFIX} ${checkResult.toString()}`);
      }
      console.log(payload, "payload");
      const query = await app.model.Activity.updateOne(
        conditions,
        payload
      ).catch(err => {
        app.logger.error(DBLOG_PREFIX, err);
        throw err;
      });
      return query;
    }
    async deleteOne({ conditions = {} }) {
      const checkResult = existCheck(
        conditions,
        {
          id: "should not be undefined."
        },
        "deleteOne"
      );
      if (checkResult instanceof Error) {
        throw new Error(`${DBLOG_PREFIX} ${checkResult.toString()}`);
      }

      const query = await app.model.Activity.deleteOne(conditions).catch(
        err => {
          app.logger.error(DBLOG_PREFIX, err);
          throw err;
        }
      );
      return query;
    }
  }
  return activity;
};
