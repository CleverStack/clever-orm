var inflect     = require( 'i' )()
  , injector    = require( 'injector' )
  , Promise     = require( 'bluebird' );

var ormUtils    = module.exports  = {

    supportSingleModule: function( env, moduleName ) {
        if ( moduleName ) {
            env.packageJson.bundledDependencies.length = 0
            env.packageJson.bundledDependencies.push( 'clever-orm', env );
            env.packageJson.bundledDependencies.push( moduleName, env );
        }
    },

    eagerLoad: function( findOptions ) {
        if ( !!findOptions.include && findOptions.include instanceof Array ) {
            for( var i = 0; i < findOptions.include.length; i++ ) {
                if ( findOptions.include[ i ]._model ) {
                    findOptions.include[ i ] = findOptions.include[ i ]._model;
                } else if ( findOptions.include[ i ].model && findOptions.include[ i ].model._model ) {
                    findOptions.include[ i ].model = findOptions.include[ i ].model._model;
                }
            }
        }
    },

    afterEagerLoad: function( findOptions, model ) {
        if ( model !== null && findOptions.include && findOptions.include.length && model._model.options.include ) {
            var models = this.getDefinedModels;

            Object.keys( model._model.options.includeMap ).forEach( function( modelName ) {
                var _include    = model._model.options.includeMap[ modelName ]
                  , as          = inflect.camelize( _include.as, false )
                  , csModel     = models[ modelName ];

                if ( !!csModel && !!model._model[ as ] ) {
                    if ( model._model[ as ] instanceof Array ) {
                        for ( var i = 0; i < model._model[ as ].length; i++ ) {
                            if ( !( model._model[ as ][ i ] instanceof csModel ) ) {
                                model._model[ as ][ i ] = new csModel( model._model[ as ][ i ] );
                            }
                        }
                    } else {
                        if ( !( model._model[ as ] instanceof csModel ) ) {
                            model._model[ as ] = new csModel( model._model[ as ] );
                        }
                    }
                }
            });
        }
    },

    find: function( findOptions, options, callback ) {
        ormUtils.eagerLoad( findOptions );

        this._model
        .find( findOptions, options )
        .then( this.callback( function( _model ) {
            var model = !!_model && _model !== null ? new this( _model ) : null;

            ormUtils.afterEagerLoad.apply( this, [ findOptions, model ] );

            callback( null, model );
        }))
        .catch( callback );
    },

    findAll: function( findOptions, options, callback ) {
        var that = this;

        ormUtils.eagerLoad( findOptions );

        this._model
        .findAll( findOptions, options )
        .then( function( _models ) {
            var models = [];
            
            _models = _models instanceof Array ? _models : [ _models ];

            _models.forEach(function( model ) {
                if ( model !== null ) {
                    model = new that( model );

                    ormUtils.afterEagerLoad.apply( that, [ findOptions, model ] );

                    models.push( model );
                }
            });

            callback( null, models );
        })
        .catch( callback );
    }
};