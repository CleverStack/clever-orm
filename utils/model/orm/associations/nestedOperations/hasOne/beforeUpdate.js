var underscore = require('underscore');
/**
 * Before updating any SourceModel that has a valid "hasOne" association with any other TargetModel, 
 * automatically update the relating model if we haven't been specifically disabled.
 * 
 * @param  {Object}   modelData    the data originally provided to SourceModel.update()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.update()
 * @param  {Function} callback     the callback to allow SourceModel.update() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports = function updateTargetModelBeforeSourceModel(as, association, targetModel, values, queryOptions, callback) {
  var valueAs     = values[as]
    , isSelfRef   = this === targetModel
    , entity      = valueAs !== undefined && valueAs !== null ? valueAs.entity : undefined
    , sourcePk    = this.primaryKey
    , targetPK    = targetModel.primaryKey
    , nestedQuery = {where:{}}
    , nestedData  = valueAs ? underscore.clone(values[as]) : false;

  if (!isSelfRef && entity === undefined && nestedData !== false && (typeof valueAs !== 'object' || valueAs[targetPK] === undefined)) {
    nestedQuery.where[targetPK] = queryOptions.where[sourcePk];
    if (queryOptions.transaction) {
      nestedQuery.transaction = queryOptions.transaction;
    }
    targetModel
      .update(nestedData, nestedQuery)
      .then(function updateHasOneTargetModel(instance) {
        values[as] = instance;
        callback(null);
      })
      .catch(callback);
  } else {
    callback(null);
  }
};