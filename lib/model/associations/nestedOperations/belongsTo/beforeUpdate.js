'use strict';

/**
 * Before updating any "SourceModel" that has a valid "hasOne" association with any other "TargetModel", 
 * automatically eager-load the relating model if we haven't been specifically disabled.
 * 
 * @param  {Object}   modelData    the data originally provided to SourceModel.update()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.update()
 * @param  {Function} callback     the callback to allow SourceModel.update() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports = function findTargetModelBeforeUpdateSourceModel(as, association, targetModel, values, queryOptions, callback) {
  var valueAs     = values[as]
    , entity      = valueAs !== undefined && valueAs !== null ? valueAs.entity : undefined
    , isTargetPk  = valueAs ? !isNaN(valueAs) : false
    , targetPK    = targetModel.primaryKey
    , nestedQuery = !!valueAs && !isTargetPk ? {where:{}} : false;

  if (entity === undefined && valueAs && !isTargetPk && (typeof valueAs !== 'object' || valueAs[targetPK] === undefined)) {
    nestedQuery.where.label = valueAs;

    targetModel
      .find(nestedQuery, queryOptions)
      .then(function(instance) {
        values[as] = instance;
        callback(null);
      })
      .catch(callback);
  } else {
    callback(null);
  }
}