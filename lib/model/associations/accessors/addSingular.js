'use strict';

var injector   = require('injector')
  , Promise    = injector.getInstance('Promise');

module.exports = function addRelationAccessor(accessor,  alias, TargetModel, where, options) {
  return new Promise(function addRelation(resolve, reject) {
    this
      .entity[accessor](where, options)
      .then(this.proxy(function hydrate() {
        resolve(this);
      }))
      .catch(reject);
  }
  .bind(this));
}