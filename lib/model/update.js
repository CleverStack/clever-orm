'use strict';

var utils      = require('utils')
  , util       = require('util')
  , underscore = require('underscore')
  , Exceptions = require('exceptions')
  , modelUtils = utils.modelUtils
  , inspect    = utils.helpers.debugInspect;

module.exports = function updateModel(values, queryOptions, callback) {
  var data = underscore.pick(values, Object.keys(this.entity.attributes));

  if (!Object.keys(data).length) {
    return callback(null, modelUtils.aliasFieldsForOutput.apply(this, [modelUtils.aliasAssociationsForOutput.apply(this, [values])]));
  }

  if (this.debug.enabled) {
    this.debug(util.format('ormUtils.update(%s)', inspect(underscore.clone(data))));
  }

  this
    .entity
    .update(data, queryOptions)
    .then(this.callback(function(rowsAffected) {
      if (rowsAffected[0] !== 0) {
        callback(null, modelUtils.aliasFieldsForOutput.apply(this, [modelUtils.aliasAssociationsForOutput.apply(this, [underscore.extend(data, queryOptions.where)])]));
      } else {
        callback(new Exceptions.ModelNotFound(util.format('%s doesn\'t exist.', this.modelName)));
      }
    }))
    .catch(callback);
}