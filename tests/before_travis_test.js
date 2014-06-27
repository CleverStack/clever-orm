var Promise = require( 'bluebird' )
  , spawn   = require( 'child_process' ).spawn
  , path    = require( 'path' )
  , fs      = require( 'fs' )
  , rimraf  = require( 'rimraf' )
  , ncp     = require( 'ncp' )
  , prName  = 'testProject';

function createProject() {
    return new Promise( function( resolve, reject ) {
        var proc = spawn ( 'clever', [ 'init', '-f', '-A', prName, 'backend' ] );

        console.log( 'step #1 - create test project - begin\n' );

        proc.stdout.on('data', function ( data ) {
            var str = data.toString();  

            if ( str.match( /ing/ ) !== null ) {
                console.log( str )
            }
        });

        proc.stderr.on('data', function ( data ) {
            console.log( 'Error in step #1 - ' + data.toString() + '\n' );
            reject ( data.toString() ); 
        });

        proc.on( 'close', function ( code ) {
            console.log('step #1 process exited with code ' + code + '\n');
            resolve();
        });
    });
}

function copyOrmModule() {
    return new Promise( function( resolve, reject ) {
        var pkgJson     = path.join( __dirname, '../', prName, 'package.json' )
          , fromDir     = path.join( __dirname, '../' )
          , toDir       = path.join( __dirname, '../', prName, 'modules', 'clever-orm' );

        console.log( 'step #2 - copy clever-orm module in test project - begin\n' );

        function copyDir ( from, to ) {
            var files = fs.readdirSync( from );

            if ( !fs.existsSync( to ) ) {
                fs.mkdir( to, function ( err ) {
                    if ( err ) {
                        console.log( 'error - ' + err)
                    }
                })
            }

            files.forEach ( function ( file ) {
                
                fs.stat( path.join( from, file ), function ( err, stats ) {
                    
                    if ( err ) {
                        console.log( 'Error in step #2 - ' + err + '\n');
                        reject ( err );
                    }

                    if ( stats && stats.isFile() ) {
                        copyFile ( path.join( from, file ), path.join( to, file ) );
                    }

                    if ( stats && stats.isDirectory() && file != prName ) {
                        ncp( path.join( from, file ), path.join( to, file ), function ( err ) {
                            if (err) {
                                console.log( 'Error in step #2 - ' + err + '\n');
                                reject ( err );
                            }
                        });
                    }
                }) 
            })
        } 

        function copyFile ( from, to ) {
            var rs = fs.createReadStream( from )
              , ws = fs.createWriteStream( to );
            
            rs.on( 'error', function( err ) {
                console.log( err );
            });

            ws.on( 'error', function(err) {
                console.log( err );
            });
              
            rs.pipe( ws );
        }

        copyDir( fromDir, toDir );

        var packageJson = require( pkgJson );
        if ( packageJson.bundledDependencies.indexOf( 'clever-orm' ) === -1 ) {
            packageJson.bundledDependencies.push( 'clever-orm' );
            fs.writeFile( pkgJson, JSON.stringify( packageJson, null, '  ' ), function( e ) {
                if ( !!e ) {
                    console.log( 'Error in step #2 - ' + e + '\n');
                    reject( e );
                } else {
                    console.log( 'step #2 - completed' );
                    resolve();
                }
            });
        } else {
            console.log( 'step #2 - completed' );
            resolve();
        }
    });
}

function cleverSetup() {
    return new Promise( function( resolve, reject ) {
        var proc = spawn ( 'clever', [ 'setup' ], { cwd: path.resolve( path.join( __dirname, '..', prName ) ) } );
        console.log( 'step #3 - clever setup' );

        proc.stderr.on('data', function (data) {
            console.log( 'Error in step #3 - ' + data.toString() + '\n');
            reject ( data.toString() );
        });

        proc.on('close', function (code) {
            console.log('step #3 process exited with code ' + code + '\n' );
            resolve();
        });
    });
}

function configureOrmModule() {
    return new Promise( function( resolve, reject ) {
        var objs = [
                { reg: /Database username/ , write: 'travis\n'   , done: false },
                { reg: /Database password/ , write: '\n'         , done: false },
                { reg: /Database name/     , write: 'test_db\n'  , done: false },
                { reg: /Database dialect/  , write: '\n'         , done: false },
                { reg: /Database port/     , write: '3306\n'     , done: false },
                { reg: /Database host/     , write: '127.0.0.1\n', done: false },
            ]
          , proc = spawn ( 'grunt', [ 'prompt:cleverOrmConfig' ], { cwd: path.resolve( path.join( __dirname, '..', prName ) ) } );

        console.log( 'step #4 - install clever-orm module - begin\n' );

        proc.stdout.on('data', function (data) {
            var str = data.toString();

            if ( str.match( /ing/ ) !== null ) {
                console.log( str )
            } 

            objs.forEach ( function ( obj, i ) {
                if ( obj.done !== true && str.match( obj.reg ) !== null ) {
                    objs[i].done = true;
                    proc.stdin.write( obj.write );
                } 
            });
        });

        proc.stderr.on('data', function (data) {
            console.log( 'Error in step #4 - ' + data.toString() + '\n');
            reject ( data.toString() );
        });

        proc.on('close', function (code) {
            console.log('step #4 process exited with code ' + code + '\n' );
            resolve();
        });
    });
}

function installTestModule() {
    return new Promise( function( resolve, reject ) {
        var pkgJson     = path.resolve( path.join( __dirname, '..', prName, 'package.json' ) )
          , packageJson = require( pkgJson )
          , source      = path.resolve( path.join( __dirname, '..', prName, 'tests', 'unit', 'test-module' ) )
          , dest        = path.resolve( path.join( __dirname, '..', prName, 'modules', 'test-module' ) );

        console.log( 'step #5 - install test-module and add to bundledDependencies - begin' );

        rimraf( dest, function( e ) {
            if ( e === null ) {
                ncp( source, dest, function( err ) {
                    if ( err !== null ) {
                        console.log( 'Error in step #5 - ' + err + '\n');
                        reject( e );
                    } else if ( packageJson.bundledDependencies.indexOf( 'test-module' ) === -1 ) {
                        packageJson.bundledDependencies.push( 'test-module' );
                        fs.writeFile( pkgJson, JSON.stringify( packageJson, null, '  ' ), function( e ) {
                            if ( !!e ) {
                                console.log( 'Error in step #5 - ' + e + '\n');
                                reject( e );
                            } else {
                                console.log( 'step #5 - completed' );
                                resolve();
                            }
                        });
                    } else {
                        console.log( 'step #5 - completed' );
                        resolve();
                    }
                });
            } else {
                console.log( 'Error in step #5 - ' + e + '\n' );
                reject();
            }
        });

    });
}

function rebaseDb() {
    return new Promise( function( resolve, reject ) {
        var proc = spawn( 'grunt', [ 'db' ], { stdio: 'inherit', cwd: path.resolve( path.join( __dirname, '..', prName ) ) } );

        console.log( 'step #6 - rebase db' );

        proc.stderr.on('data', function (data) {
            console.log( 'Error in step #6 - ' + data.toString() + '\n');
            reject( data.toString() );
        });

        proc.on('close', function (code) {
            console.log('step #6 process exited with code ' + code + '\n' );
            resolve();
        });
    });
}

createProject()
    .then( copyOrmModule )
    .then( cleverSetup )
    .then( configureOrmModule )
    .then( installTestModule )
    .then( rebaseDb )
    .catch( function (err) {
        console.log('Error - ' + err );
    });