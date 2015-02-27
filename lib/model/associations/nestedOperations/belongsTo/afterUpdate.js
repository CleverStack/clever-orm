'use strict';

/**
 * After updating any "SourceModel" that has a valid "hasOne" association with any other "TargetModel"
 * that has been updated automatically, replace the value as the instance we found.
 * 
 * @param  {Object}   values       the data originally provided to SourceModel.update()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.update()
 * @param  {Function} callback     the callback to allow SourceModel.update() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports = function aliasTargetModelAfterUpdateSourceModel(as, association, targetModel, instance, values, queryOptions, callback) {
  if (values[as] !== undefined && values[as] !== null && values[as].entity !== undefined) {
    instance[as] = values[as];
  }
  callback(null);
};