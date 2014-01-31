'use strict';

module.exports = function( grunt ) {
    return [{
        exec: {
            rebase: {
                cmd: "NODE_PATH=./lib/:./modules/; node modules/clever-orm/bin/rebase.js"
            },
            seed: {
                cmd: "NODE_PATH=./lib/:./modules/; node modules/clever-orm/bin/seedModels.js"
            }
        }
    }, function( grunt ) {
        // Register each command
        grunt.registerTask( 'db:rebase', [ 'exec:rebase' ] );
        grunt.registerTask( 'db:seed', [ 'exec:seed' ] );

        // Register db command (runs one after the other)
        grunt.registerTask( 'db', [ 'db:rebase', 'db:seed' ] );

        grunt.registerTask( 'readme', 'Displays helpful information', function ( ) {
            console.log( 'Installation instructions:' );
            console.log( '1. From your project folder run `clever install clever-orm`' );
            console.log( '' );
            console.log( '2. In the config file for your desired environment (ie. backend/config/local.json), update the clever-orm object with the details for your database.' );
            console.log( '' );
            console.log( '3. From your project\'s `backend` folder, run `NODE_ENV=local grunt db`.' );
            console.log( 'The database tables for your modules should now be installed and seeded with data!' );
        } );
    }];
};