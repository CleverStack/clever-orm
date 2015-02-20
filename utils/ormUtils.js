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
                    ormUtils.eagerLoad.apply(this, [findOptions.include[i].include]);
                }
            }
        }
    },

    afterEagerLoad: function(findOptions, model) {
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
                                ormUtils.afterEagerLoad.apply(csModel, [model.entity[as][i].entity.options, model.entity[as][i]]);
                            }
                        }
                    } else {
                        if (!(model.entity[as] instanceof csModel)) {
                            model.entity[as] = new csModel(model.entity[as]);
                            ormUtils.afterEagerLoad.apply(csModel, [model.entity[as].entity.options, model.entity[as]]);
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

        this.entity
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

        this.entity
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
        var data = underscore.pick(modelData, Object.keys(this.entity.attributes));

        this.debug(util.format('ormUtils.create(%s)', Object.keys(data).join(', ')));
        this.entity.create(data, queryOptions).then(this.callback(function(entity) {
            callback(null, new this(entity));
        }))
        .catch(sequelize.UniqueConstraintError, this.callback(function(e) {
            var columnName = Object.keys(e.fields).shift()
              , column     = underscore.findWhere(this._aliases, { columnName: columnName })
              , key        = !!column ? column.key : columnName;

            callback(new Exceptions.DuplicateModel(util.format('%s with %s of "%s" already exists.', this._name, key, e.fields[columnName])));
        }))
        .catch(callback);
    },

    update: function(values, queryOptions, callback) {
        this.entity
        .update(values, queryOptions)
        .then(callback.bind(null, null))
        .catch(callback);
    },

    save: function(data, queryOptions, callback) {
        this.debug('ormUtils.save()');

        this.entity
        .save(data, queryOptions)
        .then(callback.bind(null, null))
        .catch(callback)
    },

    destroy: function(queryOptions, callback) {
        this.debug('ormUtils.destroy()');
        
        this.entity
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