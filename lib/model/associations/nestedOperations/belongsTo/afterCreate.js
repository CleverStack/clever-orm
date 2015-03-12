/**
 * After creating any "SourceModel" that has a valid "belongsTo" association with any other "TargetModel"
 * that has been created, replace the value as the instance we found.
 * 
 * @param  {Object}   values       the data originally provided to SourceModel.update()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.update()
 * @param  {Function} callback     the callback to allow SourceModel.update() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports = function aliasTargetModelAfterCreateSourceModel(as, association, targetModel, instance, modelData, queryOptions, callback) {
  if (modelData[as] !== undefined && modelData[as] !== null && modelData[as].entity !== undefined) {
    instance.entity[as]        = modelData[as];
    instance.entity.values[as] = modelData[as];

    callback(null);
  } else {
    callback(null);
  }
};