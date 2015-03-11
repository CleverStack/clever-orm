'use strict';

var util       = require('util')
  , utils      = require('utils')
  , inspect    = utils.helpers.debugInspect;

module.exports = function saveModel(data, queryOptions, callback) {
  if (this.debug.enabled) {
    this.debug(util.format('ormUtils.save(%s)', inspect(Object.keys(data).join(', '))));
  }

  this
    .entity
    .save(data, queryOptions)
    .then(callback.bind(null, null))
    .catch(callback);
};