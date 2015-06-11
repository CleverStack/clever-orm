var underscore = require('underscore');

/**
 * Before updating any "SourceModel" that has a valid "hasMany" association with any other "TargetModel", 
 * automatically eager-load the relating models if we haven't been specifically disabled.
 * 
 * @param  {Object}   modelData    the data originally provided to SourceModel.update()
 * @param  {Object}   queryOptions the options originally provided to SourceModel.update()
 * @param  {Function} callback     the callback to allow SourceModel.update() to continue execution
 * @return {Promise}               optionally return the promise for use in spread()
 */
module.exports = function findTargetModelsBeforeUpdateSourceModel(as, association, targetModel, values, queryOptions, callback) {
  var valuesAs     = values[as] ? (values[as] instanceof Array ? underscore.clone(values[as]) : [underscore.clone(values[as])]) : false
    , isSelfRef    = this === targetModel
    , sourcePk     = this.primaryKey
    , targetPK     = targetModel.primaryKey
    , doubleLinked = association.doubleLinked;

  valuesAs = underscore.map(valuesAs, function(value) {
    return !isNaN(value) ? parseInt(value, 10) : value;
  });

  var isTargetPks  = valuesAs ? !isNaN(valuesAs[0]) : false
    , nestedQuery  = !!valuesAs && !isTargetPks ? {where:{}} : false;

  if (!isSelfRef && !!doubleLinked && !!valuesAs && valuesAs.length &&
      (typeof valuesAs[0] !== 'object' || valuesAs[0][targetPK] === undefined)) {

    targetModel
      .findAll(nestedQuery, queryOptions)
      .then(function(targets) {
        var targetModels = underscore.map(targets, function(target) {
          return target.entity;
        });
        values[as] = targetModels;
        callback(null);
      })
      .catch(callback);
  } else {
    callback(null);
  }
};