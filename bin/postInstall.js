'use strict';

var path       = require('path')
  , fs         = require('fs')
  , cp         = require('child_process')
  , config     = require('config')
  , dialect    = config['clever-orm'].db.options.dialect
  , appRoot    = path.resolve(path.join(__dirname, '..', '..', '..'))
  , verbose    = process.argv.indexOf('-v') !== -1
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

  var proc = cp.spawn('npm', ['i', dbPkg], opts);

  proc.on('close', function(code) {
    process.exit(code);
  });
}