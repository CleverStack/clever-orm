var injector    = require( 'injector' )
  , utils       = require( 'utils' )
  , async       = require( 'async' )
  , config      = require( 'config' )
  , path        = require( 'path' )
  , ormUtils    = require( path.resolve( path.join( __dirname, '..', 'lib', 'utils.js' ) ) )
  , env         = utils.bootstrapEnv()
  , moduleLdr   = env.moduleLoader;

// Rebase once our modules have loaded
moduleLdr.on( 'modulesLoaded', function() {
    var sequelize = injector.getInstance( 'sequelize' );

    console.log('Forcing Database to be created! (Note: All your data will disapear!)');
    async.waterfall(
        [
            function createDatabase( callback ) {
                var query = 'CREATE DATABASE ' + ( config[ 'clever-orm' ].db.options.dialect === 'mysql' ? 'IF NOT EXISTS ' : '' ) + config[ 'clever-orm' ].db.database;

                sequelize.query( query, { raw: true } )
                    .success( function() {
                        callback( null );
                    })
                    .error( callback );
            },

            function rebaseDatabase( callback ) {
                sequelize
                    .sync( { force: true } )
                    .success( function() {
                        callback( null );
                    })
                    .error( callback );
            }
        ],
        function shutdown( err ) {
            if ( err === null ) {
                console.log( 'Database is rebased' );
                env.moduleLoader.shutdown();
            } else {
                console.error('Error ' + env.config['clever-orm'].db.options.dialect, err);
                env.moduleLoader.shutdown();
            }
        }
    );
});

ormUtils.supportSingleModule( env, process.argv && process.argv[ 2 ] != 'null' ? process.argv[ 2 ] : false );

// Load
moduleLdr.loadModules();