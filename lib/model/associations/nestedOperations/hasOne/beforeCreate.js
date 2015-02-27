'use strict';

var underscore = require('underscore');

/**
 * Before creating any "SourceModel" that has a valid "hasOne" association with any other "TargetModel", 
 * automatically update the relating model if we haven't been specifically disabled.
 * 
 * @param  {Object}   modelData    the data originally provided to SourceModel.update()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.update()
 * @param  {Function} callback     the callback to allow SourceModel.update() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports = function createTargetModelBeforeSourceModel(as, association, targetModel, instance, modelData, queryOptions, callback) {
  if (modelData[as] !== undefined && modelData[as] !== null && modelData[as].entity === undefined && typeof modelData[as] === 'object') {
    var data = underscore.extend(
      typeof modelData[as] === 'object' ? underscore.clone(modelData[as]) : { id: modelData[as] },
      underscore.pick(instance, association.options.foreignKey)
     );

    targetModel
      .create(data, queryOptions)
      .then(function(targetInstance) {
        instance.entity[as]        = targetInstance;
        instance.entity.values[as] = targetInstance;

        callback(null);
      })
      .catch(callback);
  } else {
    callback(null);
  }
};