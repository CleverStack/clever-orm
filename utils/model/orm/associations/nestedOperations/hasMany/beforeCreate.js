var async          = require('async')
  , underscore     = require('underscore');

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
module.exports     = function findTargetModelsBeforeCreateSourceModel(as, association, targetModel, values, queryOptions, callback) {
  var valuesAs     = values[as] ? (values[as] instanceof Array ? underscore.clone(values[as]) : [underscore.clone(values[as])]) : false
    , isSelfRef    = this === targetModel
    , sourcePk     = this.primaryKey
    , targetPK     = targetModel.primaryKey
    , doubleLinked = association.doubleLinked;

  if (!!doubleLinked && !isSelfRef && !!valuesAs && valuesAs.length && valuesAs[0][targetPK] === undefined) {
    var targetIds = underscore.map(valuesAs, function(value) {
      return typeof value === 'object' ? value[targetPK] : value;
    });

    targetModel
      .findAll({where: {id: {in: targetIds}}}, queryOptions)
      .then(function(targets) {
        var targetModels = underscore.map(targets, function(target) {
          return target.entity;
        });
        values[as] = targetModels;
        callback(null, values);
      })
      .catch(callback);
      
  } else {
    callback(null);
  }
};