var inflect     = require('i')()
  , utils       = require('utils')
  , modelUtils  = utils.modelUtils
  , inspect     = modelUtils.debugInspect
  , underscore  = require('underscore')
  , async       = require('async')
  , injector    = require('injector')
  , Exceptions  = require('exceptions')
  , sequelize   = require('sequelize')
  , util        = require('util');

var ormUtils    = module.exports  = {

    supportSingleModule: function(env, moduleName) {
        if (moduleName) {
            env.packageJson.bundledDependencies.length = 0
            env.packageJson.bundledDependencies.push('clever-orm', env);
            env.packageJson.bundledDependencies.push(moduleName, env);
        }
    },

    eagerLoad: function(findOptions) {
        if (!!findOptions.include && findOptions.include instanceof Array) {
            for(var i = 0; i < findOptions.include.length; i++) {
                this.debug('eagerLoad(' + inspect(underscore.omit(findOptions.include[i], 'model', 'include')) + ', ' + inspect(findOptions.include[i].model.name) + ')');

                if (findOptions.include[i]._model) {
                    findOptions.include[i] = findOptions.include[i]._model;
                } else if (findOptions.include[i].model && findOptions.include[i].model._model) {
                    findOptions.include[i].model = findOptions.include[i].model._model;
                }

                // Handle customColumnNames in nested include.where's
                if (findOptions.include[i].where) {
                    modelUtils.aliasFieldsForQuery.apply(injector.getInstance(findOptions.include[i].model.name + 'Model'), [findOptions.include[i].where]);
                }

                // Handle nested includes
                if (findOptions.include[i].include) {
                    ormUtils.eagerLoad.apply(this, [findOptions.include[i].include]);
                }
            }
        }
    },

    afterEagerLoad: function(findOptions, model) {
        if (model !== null && findOptions.include && findOptions.include.length && model._model.options.include) {
            var models = this.getDefinedModels();

            Object.keys(model._model.options.includeMap).forEach(function(modelName) {
                var _include    = model._model.options.includeMap[modelName]
                  , as          = inflect.camelize(_include.as, false)
                  , csModel     = models[_include.association.target ? _include.association.target.name : modelName];

                this.debug('afterEagerLoad(' + inspect(_include.as) + ', ' + inspect(_include.model.name) + ')');

                if (!!csModel && !!model._model[as]) {
                    if (model._model[as] instanceof Array) {
                        for (var i = 0; i < model._model[as].length; i++) {
                            if (!(model._model[as][i] instanceof csModel)) {
                                model._model[as][i] = new csModel(model._model[as][i]);
                                ormUtils.afterEagerLoad.apply(csModel, [model._model[as][i]._model.options, model._model[as][i]]);
                            }
                        }
                    } else {
                        if (!(model._model[as] instanceof csModel)) {
                            model._model[as] = new csModel(model._model[as]);
                            ormUtils.afterEagerLoad.apply(csModel, [model._model[as]._model.options, model._model[as]]);
                        }
                    }
                }
            }
            .bind(this));
        }
    },

    find: function(findOptions, queryOptions, callback) {
        this.debug('ormUtils.find(' + inspect(findOptions) + ')');

        ormUtils.eagerLoad.apply(this, [findOptions, queryOptions]);

        this._model
        .find(findOptions, queryOptions)
        .then(function( model ) {
            ormUtils.wrapModel.apply(this, [ findOptions, model, callback ]);
        }.bind(this))
        .catch(callback);
    },

    wrapModel: function(findOptions, model, callback) {
        if (model !== null) {
            model = new this(model);

            ormUtils.afterEagerLoad.apply(this, [findOptions, model]);

            return !callback ? model : callback( null, model );
        } else {
            return !callback ? null : callback( null, null );
        }
    },

    findAll: function(findOptions, queryOptions, callback) {
        ormUtils.eagerLoad.apply(this, [findOptions, queryOptions]);

        this._model
        .findAll(findOptions, queryOptions)
        .then(this.callback(function(results) {
            results = async.map(
                results instanceof Array ? results : [results],
                this.callback(ormUtils.wrapModel, findOptions),
                callback
            );
        }))
        .catch(callback);
    },

    create: function(modelData, queryOptions, callback) {
        var data = underscore.pick(modelData, Object.keys(this._model.attributes));

        this.debug(util.format('ormUtils.create(%s)', Object.keys(data).join(', ')));
        this._model.create(data, queryOptions).then(this.callback(function(_model) {
            callback(null, new this(_model));
        }))
        .catch(sequelize.UniqueConstraintError, this.callback(function(e) {
            var columnName = Object.keys(e.fields).shift()
              , column     = underscore.findWhere(this._aliases, { columnName: columnName })
              , key        = !!column ? column.key : columnName;

            callback(new Exceptions.DuplicateModel(util.format('%s with %s of "%s" already exists.', this._name, key, e.fields[columnName])));
        }))
        .catch(callback);
    },

    save: function(data, queryOptions, callback) {
        this.debug('ormUtils.save()');

        this._model
        .save(data, queryOptions)
        .then(callback.bind(null, null))
        .catch(callback)
    },

    destroy: function(queryOptions, callback) {
        this.debug('ormUtils.destroy()');
        
        this._model
        .destroy(queryOptions)
        .then(callback.bind(null, null))
        .catch(callback)
    },

    softDeleteable: function(findOptions, queryOptions, callback) {
        if (!!this.softDeleteable) {
            this.debug('softDeleteable(' + this.deletedAt + ')');
            findOptions[this.deletedAt] = null;
        }

        callback && callback(null);
    }
};