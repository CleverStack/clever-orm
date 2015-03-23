var underscore = require('underscore');

/**
 * Before creating any "SourceModel" that has a valid "hasOne" association with any other "TargetModel", 
 * automatically eager-load the relating model if we haven't been specifically disabled.
 * 
 * @param  {Object}   values    the data originally provided to SourceModel.update()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.update()
 * @param  {Function} callback     the callback to allow SourceModel.update() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports = function findTargetModelBeforeCreateSourceModel(as, association, targetModel, values, queryOptions, callback) {
  try {
    if (values[as] !== undefined && values[as] !== null && values[as].entity === undefined && (typeof values[as] !== 'object' || values[as][targetModel.primaryKey[0]] === undefined)) {
      targetModel
        .find(typeof values[as] === 'object' ? underscore.clone(values[as]) : { where: { id: values[as] } }, queryOptions)
        .then(function(instance) {
          values[as] = instance;
          callback(null);
        })
        .catch(callback);
    } else {
      callback(null);
    }
  } catch(e) {
    callback(e);
  }
};