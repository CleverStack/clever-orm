'use strict';

var path       = require('path')
  , injector   = require('injector')
  , accessors  = require(path.resolve(path.join(__dirname, 'accessors')))
  , loaders    = require(path.resolve(path.join(__dirname, 'loaders')))
  , nestedOps  = require(path.resolve(path.join(__dirname, 'nestedOperations')))
  , underscore = injector.getInstance('underscore');

function defineAssociations(models) {
  var cleverOrm  = this
    , modelNames = Object.keys(models);

  if (cleverOrm.debug.enabled) {
    cleverOrm.debug('Defining Assocations for ' + modelNames.join(', ') + '...');
  }

  modelNames.forEach(function eachSourceModel(sourceModelName) {
    var associationTypes = Object.keys(models[sourceModelName]);

    associationTypes.forEach(function eachAssociationType(assocType) {
      var targets = models[sourceModelName][assocType];

      if (!(targets instanceof Array)) {
        targets = [targets];
      }

      targets.forEach(function associateToEachTargetModel(assocTo) {
        assocTo = assocTo instanceof Array ? underscore.clone(assocTo) : [assocTo, {}];

        var targetModelName     = assocTo.shift()
          , associationOptions  = assocTo.shift()
          , sourceModel         = injector.getInstance(sourceModelName + 'Model')
          , targetModel         = injector.getInstance((associationOptions.through ? associationOptions.through : targetModelName) + 'Model')
          , alias               = associationOptions.alias || associationOptions.as || targetModelName.replace('Model','')
          , association;

        if (associationOptions.through) {
          associationOptions.through = cleverOrm.models[associationOptions.through.replace('Model', '')];
        }

        cleverOrm.debug('%s %s %s %s', sourceModelName, assocType, targetModelName, associationOptions);
        association = cleverOrm.models[sourceModelName][assocType](cleverOrm.models[targetModelName], associationOptions);

        accessors.define(sourceModel, assocType, injector.getInstance(targetModelName + 'Model'), alias, association);

        if (associationOptions.lazy === true) {
          var lazilyLoadedIncludes;

          // Grab any of the includes for a find() before eager loading them
          sourceModel.on('beforeFind', function(findOptions, queryOptions, callback) {
            findOptions.include.every(function(include, includeIndex) {
              if (include.as === alias) {
                lazilyLoadedIncludes = include;
                findOptions.include.splice(includeIndex, 1);
                return false;
              }
              return true;
            });

            callback(null, findOptions);
          });

          // Call a finder method to lazy load the result
          sourceModel.on('afterFind', function(instance, findOptions, queryOptions, callback) {
            var association       = instance.Class.entity.associations[alias]
              , accessor          = association.accessors.get
              , targetFindOptions = {};


            if (lazilyLoadedIncludes) {
              targetFindOptions.include = targetFindOptions.include || [];
              targetFindOptions.include.push(lazilyLoadedIncludes);
            }

            instance[accessor].apply(instance, [targetFindOptions, queryOptions]).then(function(){
              callback(null);
            })
            .catch(callback);
          });
        }

        if (associationOptions.autoHooks !== false) {
          nestedOps.define(sourceModel, assocType, targetModel, alias, association);
        }
      })
    })
  })
}

module.exports = {
  define           : defineAssociations,
  accessors        : accessors,
  loaders          : loaders,
  nestedOperations : nestedOps
};