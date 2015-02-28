var path     = require('path')
  , injector = require('injector')
  , inflect  = injector.getInstance('inflect')
  , get      = require(path.resolve(path.join(__dirname, 'get')))
  , set      = require(path.resolve(path.join(__dirname, 'set')))
  , create   = require(path.resolve(path.join(__dirname, 'create')))
  , remove   = require(path.resolve(path.join(__dirname, 'remove')));

function defineAssociationAccessors(sourceModel, assocType, targetModel, alias, association) {
  var accessors   = this[assocType]
    , singular    = inflect.singularize(alias)
    , plural      = inflect.pluralize(alias);

  sourceModel.getters[association.identifier] = function getRelationIdentifier() {
    return this.entity[association.identifier];
  };
  sourceModel.getters[association.as] = function getRelation() {
    return this.entity[association.as];
  };

  sourceModel.setters[association.identifier] = function setRelationIdentifer(val) {
    this.entity[association.identifier] = val;
  };
  sourceModel.setters[association.as] = function setRelation(val) {
    this.entity[association.as] = val;
  };

  Object.keys(accessors).forEach(function(accessorName) {
    var accessor   = accessors[accessorName]
      , accessorAs = accessorName.replace('Singular', inflect.camelize(singular, true)).replace('Plural', inflect.camelize(plural, true));

    if (typeof sourceModel.entity.DAO.prototype[accessorAs] === 'function') {
      sourceModel.prototype[accessorAs] = function getRelationAccessor() {
        return function getCriteriaAndOptions() {
          var args = [].slice.call(arguments)
            , where
            , options;

          if (/set/i.test(accessorName) || /get/i.test(accessorName) || /add/i.test(accessorName)) {
            where = args[0] || {};
            options = options ? underscore.clone(args[1]) : {};
            
            if (where.entity) {
              where = where.entity;
            } else if (where instanceof Array && where[0].entity) {
              where = where.map(function(entity) {
                return entity.entity;
              });
            }
          }

          return accessor.apply(this, [accessorAs, association.as, targetModel].concat(args));
        }
      }();
    }
  });
}

module.exports = {
  define: defineAssociationAccessors,
  hasOne: {
    getSingular    : get,
    setSingular    : set,
    // createSingular : create,
    // removeSingular : remove
  },
  belongsTo: {
    getSingular    : get,
    setSingular    : set,
    // createSingular : create,
    // removeSingular : remove
  },
  hasMany: {
    getPlural      : get,
    setPlural      : set,
    // createSingular : create,
    // removeSingular : remove,
    addSingular    : require(path.resolve(path.join(__dirname, 'addSingular'))),
    // hasPlural      : require(path.resolve(path.join(__dirname, 'hasAll'))),
    // hasSingular    : require(path.resolve(path.join(__dirname, 'hasSingle'))),
    // addPlural      : require(path.resolve(path.join(__dirname, 'addMultiple'))),
    // removePlural   : require(path.resolve(path.join(__dirname, 'removeMultiple')))
  }
}