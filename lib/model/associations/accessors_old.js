module.exports = function defineModelAccessors() {
  var models  = require('models');

  Object.keys(this.models).forEach(this.proxy(function(modelName) {
    var model = this.models[modelName]
      , Model = models[modelName];

    Object.keys(model.associations).forEach(this.proxy(function(assocationName) {
      var association = model.associations[assocationName]
        , TargetModel = models[association.target.name];

      models[association.source.name].getters[association.identifier] = function() {
        return this.entity[association.identifier];
      }

      var as = inflect[association.associationType === 'HasMany' ? 'pluralize' : 'singularize'](association.as);
      models[association.source.name].getters[as] = function() {
        return this.entity[as];
      }

      models[association.source.name].setters[association.identifier] = 
      models[association.source.name].setters[as] = function(val) {
        this.entity[association.as] = val;
      };

      Object.keys(association.accessors).forEach(function(accessorName) {
        var accessor = association.accessors[accessorName]
          , isGet    = /^get/i.test(accessor)
          , isSet    = /^set/i.test(accessor);

        if (typeof model.DAO.prototype[accessor] === 'function') {
          Model.prototype[accessor] = function(where, options) {
            return new Promise(function(resolve, reject) {
              if (!/has/.test(accessor)) {
                where   = where || {};
                options = options ? underscore.clone(options) : {};

                if (where.entity) {
                  where = where.entity;
                } else if (where instanceof Array && where[0].entity) {
                  where = where.map(function(entity) {
                    return entity.entity;
                  });
                }

                if (!!isSet && !!options && options.save === false) {
                  this.entity[accessor](where, options);
                  resolve(this);
                } else if (!!isSet) {
                  this.entity[accessor](where, options)
                  .then(this.proxy(function(entity) {
                    if (this.entity[as]) {
                      this.entity[as].entity = entity;
                    }
                    resolve(this);
                  }))
                  .catch(reject);
                } else if (!!isGet) {
                  this.entity[accessor](where, options)
                  .then(this.proxy(function(entity) {
                    var instances;

                    if (entity instanceof Array) {
                      instances = entity.map(function(e) {
                        return new TargetModel(e);
                      });
                    } else {
                      instances = new TargetModel(entity);
                    }

                    this.entity.dataValues[as] = instances;

                    resolve(this);
                  }))
                  .catch(reject);
                } else {
                  this.entity[accessor](where, options)
                  .then(resolve)
                  .catch(reject);
                }
              } else {
                this.entity[accessor].then(resolve).catch(reject);
              }
            }.bind(this))
          }
        }
      });
    }));
  }));
}