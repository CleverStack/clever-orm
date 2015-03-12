var injector   = require('injector')
  , Promise    = injector.getInstance('Promise');

module.exports = function getRelationAccessor(accessor, alias, TargetModel, findOptions, options) {
  return new Promise(function getRelation(resolve, reject) {
    this
      .entity[accessor](findOptions, options)
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
};