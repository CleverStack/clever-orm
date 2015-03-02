'use strict';

var injector   = require('injector')
  , Promise    = injector.getInstance('Promise');

module.exports = function createRelationAccessor(accessor, alias, TargetModel, values, options) {
  return new Promise(function createRelation(resolve, reject) {
    this
      .entity[accessor](values, options)
      .then(this.proxy(function(entity) {
        if (this.entity[alias]) {
          this.entity[alias].entity = entity;
        }
        resolve(this);
      }))
      .catch(reject);
  }
  .bind(this));
}