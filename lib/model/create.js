var util       = require('util')
  , utils      = require('utils')
  , sequelize  = require('sequelize')
  , underscore = require('underscore')
  , Exceptions = require('exceptions')
  , inspect    = utils.helpers.debugInspect;

module.exports = function createModel(modelData, queryOptions, callback) {
  var ModelClass = this
    , data       = underscore.pick(modelData, Object.keys(this.fields));

  if (this.debug.enabled) {
    this.debug(util.format('ormUtils.create(%s)', inspect(underscore.clone(data))));
  }
  
  this.entity.create(data, queryOptions).then(this.callback(function(entity) {
    callback(null, new ModelClass(entity));
  }))
  .catch(sequelize.UniqueConstraintError, this.callback(function(e) {
    var columnName = Object.keys(e.fields).shift()
      , column     = underscore.findWhere(this.aliases, { columnName: columnName })
      , key        = !!column ? column.key : columnName;

    callback(new Exceptions.DuplicateModel(util.format('%s with %s of "%s" already exists.', this.modelName, key, e.fields[columnName])));
  }))
  .catch(callback);
};