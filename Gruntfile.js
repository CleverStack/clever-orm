'use strict';

var fs      = require( 'fs' )
,   path    = require( 'path' )

module.exports = function( grunt ) {
    return [{
        prompt: {
            cleverstack: {
                options: {
                    questions: [
                        {
                            config: 'cleverstackorm.username',
                            type: 'input',
                            message: 'Database username',
                            default: '',
                        },
                        {
                            config: 'cleverstackorm.password',
                            type: 'password',
                            message: 'Database password',
                            default: ''
                        },
                        {
                            config: 'cleverstackorm.database',
                            type: 'input',
                            message: 'Database name',
                            default: ''
                        },
                        {
                            config: 'cleverstackorm.dialect',
                            type: 'list',
                            message: 'Database dialect',
                            choices: [
                                { name: 'mysql' },
                                { name: 'mariadb' },
                                { name: 'postgres' },
                                { name: 'sqlite' }
                            ]
                        },
                        {
                            config: 'cleverstackorm.host',
                            type: 'input',
                            message: 'Database host',
                            default: '127.0.0.1'
                        },
                        {
                            config: 'cleverstackorm.port',
                            type: 'input',
                            message: 'Database port',
                            default: '3306'
                        }
                    ]
                }
            }
        },
        exec: {
            rebase: {
                cmd: "NODE_PATH=./lib/:./modules/; node modules/clever-orm/bin/rebase.js"
            },
            seed: {
                cmd: "NODE_PATH=./lib/:./modules/; node modules/clever-orm/bin/seedModels.js"
            }
        }
    }, function( grunt ) {
        grunt.loadNpmTasks('grunt-prompt');

        // Register each command
        grunt.registerTask( 'db:rebase', [ 'exec:rebase' ] );
        grunt.registerTask( 'db:seed', [ 'exec:seed' ] );

        // Register db command (runs one after the other)
        grunt.registerTask( 'db', [ 'db:rebase', 'db:seed' ] );

        grunt.registerTask( 'readme', 'Displays helpful information', function ( ) {
            console.log( 'Installation instructions:' );
            console.log( '1. In the config file for your desired environment (ie. backend/config/local.json), update the clever-orm object with the details for your database.' );
            console.log( '' );
            console.log( '2. From your project\'s `backend` folder, run `NODE_ENV=local grunt db`.' );
            console.log( 'The database tables for your modules should now be installed and seeded with data!' );
        } );

        grunt.registerTask( 'prompt:clever', [ 'prompt:cleverstack', 'createConfig' ] );
        grunt.registerTask( 'createConfig', 'Creates a .json config file for database credentials', function ( ) {
            var conf = grunt.config( 'cleverstackorm' )
            ,   obj  = {
                'clever-orm': { }
            }
            ,   file = path.join( process.cwd( ), 'config', 'local.json' );

            if (fs.existsSync( file )) {
                obj = require( file );
            }

            Object.keys( conf ).forEach( function ( key ) {
                if ([ 'host', 'dialect', 'port' ].indexOf( key ) > -1) {
                    obj[ 'clever-orm' ].db.options = obj[ 'clever-orm' ].db.options || {};
                    obj[ 'clever-orm' ].db.options[ key ] = conf[ key ];
                } else {
                    obj[ 'clever-orm' ].db[ key ] = conf[ key ];
                }
            } );

            fs.writeFileSync( file, JSON.stringify( obj, null, '  ' ) );
        } );
    }];
};