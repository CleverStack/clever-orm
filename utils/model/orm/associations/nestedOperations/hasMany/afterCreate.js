var async         = require('async')
  , underscore    = require('underscore');

/**
 * After creating any "SourceModel" that has a valid "hasMany" association with any other "TargetModel", 
 * automatically create the relating model/s if we haven't been specifically disabled.
 *
 * @todo this doesn't cater for when you have saved nested models and then specify them in the create call chain
 * 
 * @param  {Object}   instance     the model instance created by SourceModel.create()
 * @param  {Object}   values       the data originally provided to SourceModel.create()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.create()
 * @param  {Function} callback     the callback to allow SourceModel.create() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports    = function createTargetModelsAfterSourceModel(as, association, targetModel, instance, values, queryOptions, callback) {
  var valuesAs    = values[as]
    , isSelfRef   = this === targetModel
    , entity      = valuesAs !== undefined && valuesAs !== null ? valuesAs.entity : undefined
    , sourcePk    = this.primaryKey
    , targetPK    = targetModel.primaryKey
    , nestedData  = valuesAs ? underscore.clone(values[as]) : false;

  if (!isSelfRef && entity === undefined && nestedData !== false && (typeof valuesAs !== 'object' || valuesAs[targetPK] === undefined)) {
    valuesAs = valuesAs instanceof Array ? valuesAs : [valuesAs];

    if (!association.doubleLinked) {
      async.map(
        valuesAs,
        function createNestedHasManyModel(nestedModelData, done) {
          nestedModelData[association.foreignKey || association.identifier] = instance[sourcePk];

          targetModel
            .create(nestedModelData, queryOptions)
            .then(function(targetInstance) {
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
      instance[association.accessors.set](values[as], queryOptions)
      .then(function() {
        callback(null);
      })
      .catch(callback);
    }
  } else {
    callback(null);
  }
};