var injector   = require('injector')
  , Promise    = injector.getInstance('Promise');

module.exports = function defaultRelationAccessor(accessor,  alias, TargetModel, argOne, argTwo) {
  return new Promise(function defaultRelation(resolve, reject) {
    this
      .entity[accessor](argOne, argTwo)
      .then(resolve)
      .catch(reject);
  }
  .bind(this));
};