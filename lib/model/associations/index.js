'use strict';

var path       = require('path')
  , injector   = require('injector')
  , accessors  = require(path.resolve(path.join(__dirname, 'accessors')))
  , loaders    = require(path.resolve(path.join(__dirname, 'loaders')))
  , nestedOps  = require(path.resolve(path.join(__dirname, 'nestedOperations')))
  , underscore = injector.getInstance('underscore');

function defineAssociations(models) {
  /*jshint validthis: true */
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
          loaders.lazy.load(sourceModel, assocType, targetModel, alias, association);
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