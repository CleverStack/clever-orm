'use strict';

var injector   = require('injector')
  , Promise    = injector.getInstance('Promise');

module.exports = function removeRelationAccessor(accessor, alias, TargetModel, associatedObject, options) {
  return new Promise(function removeRelation(resolve, reject) {
    this
      .entity[accessor](associatedObject, options)
      .then(this.proxy(function hydrate(entity) {
        var instances;

        if (entity instanceof Array) {
          instances = entity.map(function(e) {
            return new TargetModel(e);
          });
        } else {
          instances = new TargetModel(entity);
        }

        this.entity.dataValues[alias] = instances;

        resolve(this);
      }))
      .catch(reject);
  }
  .bind(this));
}