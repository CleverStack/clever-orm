'use strict';

var injector   = require('injector')
  , underscore = require('underscore')
  , Promise    = injector.getInstance('Promise');

module.exports = function defineAccessor(accessor /*,  alias, TargetModel */) {
  return function addRelationAccessor(where, options) {
    where   = where || {};
    options = options ? underscore.clone(options) : {};

    // @todo check for instance of sequelize model and simply new Model(sequelizeModel)
    if (where.entity) {
      where = where.entity;
    } else if (where instanceof Array && where[0].entity) {
      where = where.map(function(entity) {
        return entity.entity;
      });
    }

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
}