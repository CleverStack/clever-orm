'use strict';

var path    = require('path')
  , fs      = require('fs')
  , cp      = require('child_process')
  , config  = require('config')
  , os      = require('os')
  , async   = require('async')
  , isWin   = /^win32/.test(os.platform())
  , dialect = config['clever-orm'].db.options.dialect
  , appRoot = path.resolve(path.join(__dirname, '..', '..', '..'))
  , pkgPath = path.resolve(path.join(__dirname, '..', 'package.json'))
  , pkgJson = require(pkgPath)
  , verbose = process.argv.indexOf('-v') !== -1
  , dbPkg;

switch(dialect) {

case 'mysql':
  dbPkg = ['mysql'];
  break;
case 'mariadb':
  dbPkg = ['mariasql'];
  break;
case 'mssql':
  dbPkg = ['tedious'];
  break;
case 'postgres':
  dbPkg = ['pg','pg-hstore'];
  break;
case 'sqlite':
  dbPkg = ['sqlite3'];
  break;
}

async.each(
  dbPkg,
  function installDbPackage(dbPkg, callback) {
    if (!fs.existsSync(path.join(appRoot, 'node_modules', dbPkg))) {
      var opts = { cwd: appRoot };
      if (verbose) {
        opts.stdio = 'inherit';
      }

      cp
      .spawn(!isWin ? 'npm' :'npm.CMD', ['i', dbPkg], opts)
      .on('close', function(code) {
        if (code === 0) {
          pkgJson.dependencies[dbPkg] = '~' + require(path.join(appRoot, 'node_modules', dbPkg, 'package.json')).version;
          fs.writeFile(pkgPath, JSON.stringify( pkgJson, null, '  '), function(err) {
            callback(err, code);
          });
        } else {
          process.exit(code);
        }
      });
    }    
  },
  function installationCompleted(err) {
    if (err) {
      console.error(err);
    }
    process.exit(0);
  }
);