'use strict';

var underscore = require('underscore');

/**
 * Before creating any "SourceModel" that has a valid "hasOne" association with any other "TargetModel", 
 * automatically eager-load the relating model if we haven't been specifically disabled.
 * 
 * @param  {Object}   modelData    the data originally provided to SourceModel.update()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.update()
 * @param  {Function} callback     the callback to allow SourceModel.update() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports = function findTargetModelBeforeCreateSourceModel(as, association, targetModel, modelData, queryOptions, callback) {
  if (modelData[as] !== undefined && modelData[as] !== null && modelData[as].entity === undefined && (typeof modelData[as] !== 'object' || modelData[as][targetModel.primaryKey[0]] === undefined)) {
    targetModel
      .find(typeof modelData[as] === 'object' ? underscore.clone(modelData[as]) : { where: { id: modelData[as] } }, queryOptions)
      .then(function(instance) {
        modelData[as] = instance;
        callback(null);
      })
      .catch(callback);
  } else {
    callback(null);
  }
}