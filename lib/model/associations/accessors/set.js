'use strict';

var injector   = require('injector')
  , underscore = require('underscore')
  , Promise    = injector.getInstance('Promise');

module.exports = function defineAccessor(accessor, alias/*, TargetModel*/) {
  return function setRelationAccessor(where, options) {
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

    return new Promise(function setRelation(resolve, reject) {
      var promise = this.entity[accessor](where, options);

      where   = where || {};
      options = options ? underscore.clone(options) : {};

      if (where.entity) {
        where = where.entity;
      } else if (where instanceof Array && where[0].entity) {
        where = where.map(function(entity) {
          return entity.entity;
        });
      }
      
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
}