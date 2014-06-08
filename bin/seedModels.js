var injector    = require( 'injector' )
  , fs          = require( 'fs' )
  , path        = require( 'path' )
  , crypto      = require( 'crypto' )
  , async       = require( 'async' )
  , utils       = require( 'utils' )
  , env         = utils.bootstrapEnv()
  , moduleLdr   = env.moduleLoader
  , inflect     = require( 'i' )()
  , moduleName  = process.argv && process.argv[ 2 ] != 'null' ? process.argv[ 2 ] : false;

// Seed once our modules have loaded
moduleLdr.on( 'modulesLoaded', function() {
    var seedData = require( 'seedData' )
      , models = require( 'models' );

    var assocMap = {};
    Object.keys(seedData).forEach(function( modelName ) {
        assocMap[modelName] = [];
    });

    async.forEachSeries(
        Object.keys(seedData),
        function forEachModelType( modelName, cb ) {
            var ModelType = models[ modelName.replace( 'Model', '' ) ]
              , Models = seedData[modelName];

            if ( !ModelType || !Models ) {
                return cb();
            }

            async.forEachSeries(
                Models,
                function forEachModel( data, modelCb ) {
                    var assocs = data.associations;
                    delete data.associations;

                    ModelType.create(data).then(function( model ) {
                        data.associations = assocs;

                        console.log('Created ' + modelName);
                        assocMap[modelName].push(model);
                        if ( data.associations !== undefined ) {
                            var assocLength = Object.keys(data.associations).length,
                                called = 0;

                            Object.keys(data.associations).forEach(function( assocModelName ) {
                                var required = data.associations[assocModelName]
                                    , associations = [];

                                assocMap[assocModelName].forEach(function( m ) {
                                    var isMatched = null;

                                    Object.keys(required).forEach(function( reqKey ) {
                                        if ( isMatched !== false ) {
                                            if ( m[reqKey] === required[reqKey] ) {
                                                isMatched = true;
                                            } else {
                                                isMatched = false;
                                            }
                                        }
                                    });

                                    if ( isMatched ) {
                                        associations.push(m);
                                    }
                                });

                                if ( associations.length ) {
                                    var funcName = 'set' + inflect.pluralize(assocModelName);

                                    // Handle hasOne
                                    if ( typeof model[funcName] !== 'function' ) {
                                        funcName = 'set' + assocModelName;
                                        associations = associations[0];
                                    }
                                    
                                    // strip "Model" from funcName
                                    funcName = funcName.replace(/(Model)$/g,'');

                                    console.log('Calling ' + funcName);
                                    model[funcName](associations).success(function() {
                                        called++;

                                        if ( called == assocLength )
                                            modelCb(null);
                                    }).error(modelCb);
                                }
                            });
                        } else {
                            modelCb(null);
                        }
                    }).catch(modelCb);
                },
                function forEachModelComplete( err ) {
                    cb(err);
                }
            );
        },
        function forEachModelTypeComplete( err ) {
            console.log(err ? 'Error: ' : 'Seed completed with no errors', err);
            env.moduleLoader.shutdown();
        }
    );
});

// Allow loading only one model at a time to rebase
if ( moduleName ) {
    env.packageJson.bundledDependencies.length = 0
    env.packageJson.bundledDependencies.push( 'clever-orm', env );
    env.packageJson.bundledDependencies.push( moduleName, env );
}

// Load
moduleLdr.loadModules();