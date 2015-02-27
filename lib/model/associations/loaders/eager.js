var injector   = require('injector')
  , utils      = require('utils')
  , modelUtils = utils.modelUtils
  , inspect    = modelUtils.debugInspect
  , underscore = injector.getInstance('underscore')

module.exports.load = function eagerLoad(findOptions) {
  if (!!findOptions.include && findOptions.include instanceof Array) {
    for(var i = 0; i < findOptions.include.length; i++) {
      this.debug('eagerLoad(' + inspect(underscore.omit(findOptions.include[i], 'model', 'include')) + ', ' + inspect(findOptions.include[i].model.name) + ')');

      if (findOptions.include[i].entity) {
        findOptions.include[i] = findOptions.include[i].entity;
      } else if (findOptions.include[i].model && findOptions.include[i].model.entity) {
        findOptions.include[i].model = findOptions.include[i].model.entity;
      }

      // Handle customColumnNames in nested include.where's
      if (findOptions.include[i].where) {
        modelUtils.aliasFieldsForQuery.apply(injector.getInstance(findOptions.include[i].model.name + 'Model'), [findOptions.include[i].where]);
      }

      // Handle nested includes
      if (findOptions.include[i].include) {
        eagerLoad.apply(this, [findOptions.include[i].include]);
      }
    }
  }
}

module.exports.afterLoad = function hydrateAfterEagerLoad(findOptions, model) {
  if (model !== null && findOptions.include && findOptions.include.length && model.entity.options.include) {
    var models = this.getDefinedModels();

    Object.keys(model.entity.options.includeMap).forEach(function(modelName) {
      var _include    = model.entity.options.includeMap[modelName]
        , as          = inflect.camelize(_include.as, false)
        , csModel     = models[_include.association.target ? _include.association.target.name : modelName];

      this.debug('afterEagerLoad(' + inspect(_include.as) + ', ' + inspect(_include.model.name) + ')');

      if (!!csModel && !!model.entity[as]) {
        if (model.entity[as] instanceof Array) {
          for (var i = 0; i < model.entity[as].length; i++) {
            if (!(model.entity[as][i] instanceof csModel)) {
              model.entity[as][i] = new csModel(model.entity[as][i]);
              hydrateAfterEagerLoad.apply(csModel, [model.entity[as][i].entity.options, model.entity[as][i]]);
            }
          }
        } else {
          if (!(model.entity[as] instanceof csModel)) {
            model.entity[as] = new csModel(model.entity[as]);
            hydrateAfterEagerLoad.apply(csModel, [model.entity[as].entity.options, model.entity[as]]);
          }
        }
      }
    }
    .bind(this));
  }
}