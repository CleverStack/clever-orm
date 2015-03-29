var util       = require('util')
  , utils      = require('utils')
  , underscore = require('underscore')
  , Exceptions = require('exceptions')
  , inspect    = utils.helpers.debugInspect;

module.exports = function destroyModel(queryOptions, callback) {
  if (this.debug.enabled) {
    this.debug(util.format('ormUtils.destroy(%s)', inspect(underscore.clone(queryOptions.where))));
  }
  
  this
    .entity
    .destroy(queryOptions)
    .then(this.callback(function(rowsAffected) {
      if (rowsAffected !== 0) {
        callback(null, {});
      } else {
        callback(new Exceptions.ModelNotFound(util.format('%s doesn\'t exist.', this.modelName)));
      }
    }))
    .catch(callback);
};