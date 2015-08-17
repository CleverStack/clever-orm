'use strict';

var path    = require('path')
  , fs      = require('fs')
  , cp      = require('child_process')
  , config  = require('config')
  , os      = require('os')
  , isWin   = /^win32/.test(os.platform());
  , dialect = config['clever-orm'].db.options.dialect
  , appRoot = path.resolve(path.join(__dirname, '..', '..', '..'))
  , pkgPath = path.resolve(path.join(__dirname, '..', 'package.json'))
  , pkgJson = require(pkgPath)
  , verbose = process.argv.indexOf('-v') !== -1
  , dbPkg;

switch(dialect) {

case 'mysql':
  dbPkg = 'mysql';
  break;
case 'mariadb':
  dbPkg = 'mariasql';
  break;
case 'mssql':
  dbPkg = 'tedious';
  break;
case 'postgres':
  dbPkg = 'pg pg-hstore';
  break;
case 'sqlite':
  dbPkg = 'sqlite3';
  break;
}

if (!fs.existsSync(path.join(appRoot, 'node_modules', dbPkg))) {
  var opts = { cwd: appRoot };
  if (verbose) {
    opts.stdio = 'inherit';
  }

  var proc = cp.spawn(!isWin ? 'npm' :'npm.CMD', ['i', dbPkg], opts);

  proc.on('close', function(code) {
    if (code === 0) {
      pkgJson.dependencies[dbPkg] = '~' + require(path.join(appRoot, 'node_modules', dbPkg, 'package.json')).version;
      fs.writeFile(pkgPath, JSON.stringify( pkgJson, null, '  '), function(err) {
        if (err) {
          console.error(err);
        }
        process.exit(code);
      });
    } else {
      process.exit(code);
    }
  });
}
