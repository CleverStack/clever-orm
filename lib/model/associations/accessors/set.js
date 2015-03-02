'use strict';

var injector   = require('injector')
  , Promise    = injector.getInstance('Promise');

module.exports = function setRelationAccessor(accessor, alias, TargetModel, where, options) {
  return new Promise(function setRelation(resolve, reject) {
    var promise = this.entity[accessor](where, options);

    if (!options || options.save !== false) {
      promise
        .then(this.proxy(function(entity) {
          if (this.entity[alias]) {
            this.entity[alias].entity = entity;
          }
          return this;
        }))
    }

    promise
      .then(resolve)
      .catch(reject);
  }
  .bind(this));
}