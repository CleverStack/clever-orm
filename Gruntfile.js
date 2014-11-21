'use strict';

var fs          = require( 'fs' )
  , path        = require( 'path' )
  , pkgJson     = require( path.resolve( path.join( __dirname, '..', '..', 'package.json') ) )
  , odmEnabled  = pkgJson.bundledDependencies.indexOf( 'clever-odm' ) !== -1
  , _           = require( 'underscore' );

module.exports = function( grunt ) {
    // Arguments for individual module rebase/seed
    var dbTarget = grunt.option( 'module' ) || null;

    return [{
        prompt: {
            cleverOrmConfigPrompt: {
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
            ormRebase: {
                cmd: "node modules/clever-orm/bin/rebase.js " + dbTarget
            },
            ormSeed: {
                cmd: "node modules/clever-orm/bin/seedModels.js " + dbTarget
            }
        }
    }, function( grunt ) {
        grunt.loadNpmTasks('grunt-prompt');

        // Register each command
        grunt.registerTask( 'db:ormRebase', [ 'exec:ormRebase' ] );
        grunt.registerTask( 'db:ormSeed', [ 'exec:ormSeed' ] );
        
        // Register grouped command
        grunt.registerTask( 'db:orm', [ 'db:ormRebase', 'db:ormSeed' ] );

        if ( odmEnabled ) {
            grunt.registerTask( 'db:rebase', [ 'db:ormRebase', 'db:odmRebase' ] );
            grunt.registerTask( 'db:seed', [ 'db:ormSeed', 'db:odmSeed' ] );
            grunt.registerTask( 'db', [ 'db:rebase', 'db:seed' ] );
        } else {
            grunt.registerTask( 'db:rebase', [ 'db:ormRebase' ] );
            grunt.registerTask( 'db:seed', [ 'db:ormSeed' ] );
            grunt.registerTask( 'db', [ 'db:orm' ] );
        }

        grunt.registerTask( 'readme', 'Displays helpful information', function ( ) {
            console.log( 'Installation instructions:' );
            console.log( '1. In the config file for your desired environment (ie. backend/config/local.json), update the clever-orm object with the details for your database.' );
            console.log( '' );
            console.log( '2. From your project\'s `backend` folder, run `NODE_ENV=local grunt db`.' );
            console.log( 'The database tables for your modules should now be installed and seeded with data!' );
        } );

        grunt.registerTask( 'prompt:cleverOrmConfig', [ 'prompt:cleverOrmConfigPrompt', 'cleverOrmCreateConfig' ] );
        grunt.registerTask( 'cleverOrmCreateConfig', 'Creates a .json config file for database credentials', function ( ) {
            var conf    = grunt.config( 'cleverstackorm' )
              , obj     = require( path.resolve( path.join( process.cwd(), 'modules', 'clever-orm', 'config', 'default.json' ) ) )
              , env     = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'local'
              , file    = path.join( process.cwd( ), 'config', env + '.json' );

            if ( fs.existsSync( file ) ) {
                obj = _.extend( obj, require( file ) );
            }

            obj[ 'clever-orm' ] = obj[ 'clever-orm' ] || {};

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