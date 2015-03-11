'use strict';

var async      = require('async')
  , underscore = require('underscore');

/**
 * After creating any "SourceModel" that has a valid "hasMany" association with any other "TargetModel", 
 * automatically create the relating model/s if we haven't been specifically disabled.
 * 
 * @param  {Object}   instance     the model instance created by SourceModel.create()
 * @param  {Object}   modelData    the data originally provided to SourceModel.create()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.create()
 * @param  {Function} callback     the callback to allow SourceModel.create() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports = function createTargetModelsAfterSourceModel(as, association, targetModel, instance, modelData, queryOptions, callback) {

  // handle single association creation via the singular name
  // handle multiple association create via the plural name as an array of models
  // support nested association hasMany creation (plural and singular) with "Through", findBy ?
  // allow mapping of requestFields that will be used for create
  // allow definition of finders?

  if (modelData[as] !== undefined && modelData[as] !== null && modelData[as] instanceof Array && modelData[as].length) {
    async.map(
      modelData[as],
      function createNestedHasManyModel(nestedModelData, done) {
        var data = underscore.extend(
          typeof nestedModelData === 'object' ? underscore.clone(nestedModelData) : { id: nestedModelData },
          underscore.pick(instance, association.options.foreignKey)
         );

        targetModel.create(data, queryOptions).then(function(targetInstance) {
          done(null, targetInstance);
        })
        .catch(done);
      },
      function createdNestedHasManyModels(err, associations) {
        if (!err) {
          instance.entity[as]        = associations;
          instance.entity.values[as] = associations;

          callback(null);
        } else {
          callback(err);
        }
      }
     );
  } else {
    callback(null);
  }
};