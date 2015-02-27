'use strict';

var util       = require('util')
  , utils      = require('utils')
  , inspect    = utils.helpers.debugInspect;

module.exports = function destroyModel(queryOptions, callback) {
  if (this.debug.enabled) {
    this.debug(util.format('ormUtils.destroy(%s)', inspect(Object.keys(queryOptions).join(', '))));
  }
  
  this
    .entity
    .destroy(queryOptions)
    .then(callback.bind(null, null))
    .catch(callback)
}