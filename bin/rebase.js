'use strict';

var injector    = require('injector')
  , util        = require('util')
  , utils       = require('utils')
  , async       = require('async')
  , config      = require('config')
  , path        = require('path')
  , fs          = require('fs')
  , debug       = require('debug')('cleverstack:cleverOrm:rebase')
  , helpers     = utils.helpers
  , env         = utils.bootstrapEnv()
  , moduleLdr   = env.moduleLoader;

debug('Using configuration:');
debug(util.inspect(config['clever-orm'].modelAssociations));

// Rebase once our modules have loaded
moduleLdr.on('modulesLoaded', function() {
  var sequelize = injector.getInstance('sequelize');

  debug('Forcing Database to be created! (Note: All your data will disapear!)');
  async.waterfall(
    [
      function createDatabase(callback) {
        var query = 'CREATE DATABASE ' + (config['clever-orm'].db.options.dialect === 'mysql' ? 'IF NOT EXISTS ' : '') + config['clever-orm'].db.database;

        sequelize.query(query, { raw: true })
          .then(function() {
            callback(null);
          })
          .catch(callback);
      },

      function rebaseDatabase(callback) {
        sequelize
          .sync({ force: true })
          .then(function() {
            callback(null);
          })
          .catch(callback);
      },

      function runDialectSqlFile(callback) {
        var dialectSqlFile = path.resolve(path.join(__dirname, '..', '..', '..', 'schema', config['clever-orm'].db.options.dialect + '.sql'));
        
        if (fs.existsSync(dialectSqlFile)) {
          fs.readFile(dialectSqlFile, function(err, sql) {
            if (err || !sql) {
              debug('No specific dialect SQL found continuing...');
              return callback();
            }

            debug('Running dialect specific SQL');
            sequelize.query(sql.toString(), null, { raw: true }).then(function() {
              callback(null);
            })
            .catch(callback);
          });
        } else {
          callback(null);
        }
      }
    ],
    function shutdown(err) {
      if (err === null) {
        debug('Database is rebased');
        process.exit(0);
      } else {
        console.error('Error ' + env.config['clever-orm'].db.options.dialect, err);
        process.exit(1);
      }
    }
 );
});

helpers.supportSingleDbModule(env, 'clever-orm', process.argv && process.argv[2] != 'null' ? process.argv[2] : false);

// Load
moduleLdr.loadModules();