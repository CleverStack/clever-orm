var injector    = require( 'injector' )
  , fs          = require( 'fs' )
  , utils       = require( 'utils' )
  , env         = utils.bootstrapEnv()
  , moduleLdr   = env.moduleLoader
  , moduleName  = process.argv && process.argv[ 2 ] != 'null' ? process.argv[ 2 ] : false;

// Rebase once our modules have loaded
moduleLdr.on( 'modulesLoaded', function() {
    console.log('Forcing Database to be created! (Note: All your data will disapear!)');

    // Force a sync
    injector.getInstance( 'sequelize' )
        .sync( { force: true } )
        .success(function () {
        	console.log( 'Database is rebased' );
            // @TODO implement dialect specific SQL running after rebase (triggers etc)

            env.moduleLoader.shutdown();
        })
        .error(function( err ) {
            console.error('Error ' + env.config['clever-orm'].db.options.dialect, err);
            
            env.moduleLoader.shutdown();
        });
});

// Allow loading only one model at a time to rebase
if ( moduleName ) {
    env.packageJson.bundledDependencies.length = 0
    env.packageJson.bundledDependencies.push( 'clever-orm', env );
    env.packageJson.bundledDependencies.push( moduleName, env );
}

// Load
moduleLdr.loadModules();