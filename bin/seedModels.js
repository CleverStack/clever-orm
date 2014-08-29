var path        = require( 'path' )
  , ormUtils    = require( path.resolve( path.join( __dirname, '..', 'lib', 'utils.js' ) ) )
  , async       = require( 'async' )
  , utils       = require( 'utils' )
  , env         = utils.bootstrapEnv()
  , moduleLdr   = env.moduleLoader
  , _           = require( 'underscore' )
  , config      = require( 'config' )
  , inflect     = require( 'i' )();

// Seed once our modules have loaded
moduleLdr.on( 'modulesLoaded', function() {
    var seedData = require( 'seedData' )
      , models = require( 'models' );

    var assocMap = {};
    Object.keys( seedData ).forEach(function( modelName ) {
        assocMap[ modelName ] = [];
    });

    async.waterfall(
        [
            function createModels( callback ) {
                async.forEach(
                    Object.keys( seedData ),
                    function forEachSeedDataModel( modelName, cb ) {
                        var ModelType = models[ modelName.replace( 'Model', '' ) ]
                          , Models = seedData[ modelName ];

                        if ( !ModelType || !Models || ModelType.type !== 'ORM' ) {
                            return cb();
                        }

                        async.forEach(
                            Models,
                            function createModel( modelData, modelCb ) {
                                var data         = _.clone( modelData )
                                  , associations = data.associations;

                                delete data.associations;

                                ModelType
                                    .create( data )
                                    .then(function( model ) {
                                        console.log( 'Created ' + modelName );
                                        if ( associations ) {
                                            model.associations = associations;
                                        }
                                        assocMap[ modelName ].push( model );
                                        modelData.id = model.id;
                                        modelCb( null );
                                    })
                                    .catch( modelCb );
                            },
                            cb
                        );
                    },
                    callback
                )
            },
            function associateModels( callback ) {
                async.forEachSeries(
                    Object.keys( seedData ),
                    function forEachSeedDataModel( modelName, cb ) {
                        var ModelType = models[ modelName.replace( 'Model', '' ) ]
                          , Models = seedData[ modelName ];

                        if ( !ModelType || !Models || ModelType.type !== 'ORM' ) {
                            return cb();
                        }

                        async.forEachSeries(
                            Models,
                            function associateModel( data, modelCb ) {
                                if ( data.associations !== undefined ) {
                                    var assocLength = Object.keys( data.associations ).length
                                      , called      = 0
                                      , model       = _.findWhere( assocMap[ modelName ], { id: data.id } );

                                    Object.keys( data.associations ).forEach( function( assocModelName ) {
                                        var required     = data.associations[ assocModelName ]
                                          , associations = [];

                                        if ( !( required instanceof Array ) ) {
                                            required = [ required ];
                                        }

                                        required.forEach( function( requiredModels ) {
                                            if ( typeof requiredModels !== 'array' ) {
                                                requiredModels = [ requiredModels ];
                                            }
                                            
                                            requiredModels.forEach( function( requiredModel ) {
                                                if ( ( associatedModel = _.findWhere( assocMap[ assocModelName ], requiredModel )) !== undefined ) {
                                                    associations.push( associatedModel._model );
                                                }
                                            });
                                        });


                                        if ( associations.length ) {
                                            assocModelName = assocModelName.replace( /(Model)$/g, '' );
                                            var assocConfig = config[ 'clever-orm' ].modelAssociations[  modelName.replace( /(Model)$/g, '' ) ];
                                            Object.keys( assocConfig ).every( function( associatedModelType ) {
                                                assocConfig[ associatedModelType ].forEach( function( _model ) {
                                                    _model = _model instanceof Array ? _model : [ _model, {} ];

                                                    if ( assocModelName === _model[ 0 ] ) {
                                                        assocModelName = inflect.camelize( _model[ 1 ].as ? _model[ 1 ].as : _model[ 0 ] );
                                                        return false;
                                                    }

                                                    return true;
                                                });
                                            });

                                            var funcName = 'set' + inflect.pluralize( assocModelName.replace( /(Model)$/g,'' ) );

                                            // Handle hasOne
                                            if ( typeof model._model[ funcName ] !== 'function' ) {
                                                funcName = 'set' + assocModelName.replace( /(Model)$/g,'' );
                                                associations = associations[ 0 ];
                                            }

                                            console.log( 'Calling ' + modelName + '.' + funcName + '()' );
                                            model[ funcName ]( associations )
                                                .then(function() {
                                                    called++;

                                                    if ( called == assocLength ) {
                                                        modelCb( null );
                                                    }
                                                })
                                                .catch( modelCb );
                                        } else {
                                            modelCb( null );
                                        }
                                    });
                                } else {
                                    modelCb( null );
                                }
                            },
                            cb
                        );
                    },
                    callback
                )
            }
        ],
        function forEachModelTypeComplete( err ) {
            if ( err === null || err === undefined ) {
                console.log( 'Seed completed with no errors' );
                process.exit( 0 );
            } else {
                console.log( err );
                process.exit( 1 );
            }
        }
    );
});

ormUtils.supportSingleModule( env, process.argv && process.argv[ 2 ] != 'null' ? process.argv[ 2 ] : false );

// Load
moduleLdr.loadModules();
