var injector   = require('injector')
  , utils      = require('utils')
  , inspect    = utils.model.helpers.debugInspect
  , underscore = injector.getInstance('underscore')
  , inflect    = injector.getInstance('inflect');

module.exports.load = function eagerLoad(findOptions) {
  if (!!findOptions.include && findOptions.include instanceof Array) {
    for(var i = 0; i < findOptions.include.length; i++) {
      if (this.debug.enabled) {
        this.debug('eagerLoad(' + inspect(underscore.omit(findOptions.include[i], 'model', 'include')) + ', ' + inspect(findOptions.include[i].model.name) + ')');
      }

      if (findOptions.include[i].entity) {
        findOptions.include[i] = findOptions.include[i].entity;
      } else if (findOptions.include[i].model && findOptions.include[i].model.entity) {
        findOptions.include[i].model = findOptions.include[i].model.entity;
      }

      // Handle customColumnNames in nested include.where's
      if (findOptions.include[i].where) {
        utils.model.helpers.alias.fields.forQuery.apply(injector.getInstance(findOptions.include[i].model.name + 'Model'), [findOptions.include[i].where]);
      }

      // Handle nested includes
      if (findOptions.include[i].include) {
        eagerLoad.apply(this, [findOptions.include[i].include]);
      }
    }
  }
};

module.exports.afterLoad = function hydrateAfterEagerLoad(findOptions, model) {
  if (model !== null && findOptions.include && findOptions.include.length && model.entity.options.include) {
    var models = this.getDefinedModels();

    Object.keys(model.entity.options.includeMap).forEach(function(modelName) {
      var _include    = model.entity.options.includeMap[modelName]
        , as          = inflect.camelize(_include.as, false)
        , CsModel     = models[_include.association.target ? _include.association.target.name : modelName];

      if (this.debug.enabled) {
        this.debug('afterEagerLoad(' + inspect(_include.as) + ', ' + inspect(_include.model.name) + ')');
      }

      if (!!CsModel && !!model.entity[as]) {
        if (model.entity[as] instanceof Array) {
          for (var i = 0; i < model.entity[as].length; i++) {
            if (!(model.entity[as][i] instanceof CsModel)) {
              model.entity[as][i] = new CsModel(model.entity[as][i]);
              hydrateAfterEagerLoad.apply(CsModel, [model.entity[as][i].entity.options, model.entity[as][i]]);
            }
          }
        } else {
          if (!(model.entity[as] instanceof CsModel)) {
            model.entity[as] = new CsModel(model.entity[as]);
            hydrateAfterEagerLoad.apply(CsModel, [model.entity[as].entity.options, model.entity[as]]);
          }
        }
      }
    }
    .bind(this));
  }
};