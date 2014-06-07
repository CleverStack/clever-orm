var fs = require( 'fs' )
  , utils = require( 'utils' )
  , env = utils.bootstrapEnv() // Bootstrap the environment
  , moduleName = process.argv && process.argv[ 2 ] != 'null'
        ? process.argv[ 2 ]
        : false;

// Add some classes for simplicity
var classes = require( 'classes' );
injector.instance( 'Class', classes.Class );
injector.instance( 'Model', classes.Model );
injector.instance( 'Service', classes.Service );
injector.instance( 'Controller', classes.Controller );
injector.instance( 'Module', classes.Module );

console.log('Forcing Database to be created! (Note: All your data will disapear!)');

// Load all the modules
if ( moduleName ) {
    env.moduleLoader.loadModule( 'clever-orm', env );
    env.moduleLoader.loadModule( moduleName, env );
} else {
    env.moduleLoader.loadModules( env );
}

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
