'use strict';

var fs         = require('fs')
  , path       = require('path')
  , appRoot    = path.resolve(path.join(__dirname, '..', '..'))
  , pkgJson    = require(path.resolve(path.join(appRoot, 'package.json')))
  , odmEnabled = pkgJson.bundledDependencies.indexOf('clever-odm') !== -1
  , underscore = require('underscore');

module.exports = function(grunt) {
  var defaultConfig = require(path.join(__dirname, 'config', 'default.json'))
    , configFile    = null
    , config        = {}
    , dbTarget      = grunt.option('module') || null
    , verbose       = grunt.option('verbose');

  return [{
    prompt: {
      cleverOrmConfigPrompt: {
        options: {
          questions: [
            {
              config: 'cleverstackorm.environment',
              type: 'list',
              message: 'What environment is this configuration for?',
              choices: [
                { name: 'LOCAL' },
                { name: 'TEST' },
                { name: 'DEV' },
                { name: 'STAG' },
                { name: 'PROD' }
              ],
              default: function() {
                return process.env.NODE_ENV ? process.env.NODE_ENV.toUpperCase() : 'LOCAL';
              },
              filter: function(env) {
                underscore.extend(config, defaultConfig);

                configFile = path.resolve(path.join(appRoot, 'config', env.toLowerCase() + '.json'));

                if (fs.existsSync(configFile)) {
                  underscore.extend(config, require(configFile));
                  
                  Object.keys(defaultConfig['clever-orm']).forEach(function(key) {
                    if (typeof config['clever-orm'][key] === 'undefined') {
                      config['clever-orm'][key] = defaultConfig['clever-orm'][key];
                    }
                  });
                }

                return env;
              }
            },
            {
              config: 'cleverstackorm.username',
              type: 'input',
              message: 'Database username',
              default: function() {
                return config['clever-orm'].db.username;
              }
            },
            {
              config: 'cleverstackorm.password',
              type: 'password',
              message: 'Database password',
              default: function() {
                return config['clever-orm'].db.password;
              }
            },
            {
              config: 'cleverstackorm.database',
              type: 'input',
              message: 'Database name',
              default: function() {
                return config['clever-orm'].db.database || 'nodeseed';
              }
            },
            {
              config: 'cleverstackorm.dialect',
              type: 'list',
              message: 'Database dialect',
              choices: [
                { name: 'mysql' },
                { name: 'mssql' },
                { name: 'mariadb' },
                { name: 'postgres' },
                { name: 'sqlite' }
              ],
              default: function() {
                return config['clever-orm'].db.options.dialect || 'mysql';
              }
            },
            {
              config: 'cleverstackorm.host',
              type: 'input',
              message: 'Database host',
              default: function() {
                return config['clever-orm'].db.options.host || '127.0.0.1';
              }
            },
            {
              config: 'cleverstackorm.port',
              type: 'input',
              message: 'Database port',
              default: function(answers) {
                var dialect = config['clever-orm'].db.options.dialect
                  , port    = config['clever-orm'].db.options.port;

                if (dialect && dialect !== answers['cleverstackorm.dialect']) {
                  port = false;
                }

                if (!port) {
                  switch(dialect) {

                  case 'mysql':
                  case 'mariadb':
                    port = 3306;
                    break;
                  case 'mssql':
                    port = 1433;
                    break;
                  case 'postgres':
                    port = 5432;
                    break;
                  case 'sqlite':
                    port = '';
                    break;
                  }
                }

                return port;
              }
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
      },
      ormPostInstall: {
        cmd: "node modules/clever-orm/bin/postInstall.js " + (verbose ? '-v' : '')
      },

    }
  }, function(grunt) {
    grunt.loadNpmTasks('grunt-prompt');

    // Register each command
    grunt.registerTask('db:ormRebase', ['exec:ormRebase']);
    grunt.registerTask('db:ormSeed', ['exec:ormSeed']);
    
    // Register grouped command
    grunt.registerTask('db:orm', ['db:ormRebase', 'db:ormSeed']);

    if (odmEnabled) {
      grunt.registerTask('db:rebase', ['db:ormRebase', 'db:odmRebase']);
      grunt.registerTask('db:seed', ['db:ormSeed', 'db:odmSeed']);
      grunt.registerTask('db', ['db:rebase', 'db:seed']);
    } else {
      grunt.registerTask('db:rebase', ['db:ormRebase']);
      grunt.registerTask('db:seed', ['db:ormSeed']);
      grunt.registerTask('db', ['db:orm']);
    }

    grunt.registerTask('prompt:cleverOrmConfig', ['prompt:cleverOrmConfigPrompt', 'cleverOrmCreateConfig', 'exec:ormPostInstall']);
    grunt.registerTask('cleverOrmCreateConfig', 'Creates a .json config file for database credentials', function createOrmConfig() {
      var conf    = grunt.config('cleverstackorm')
        , obj     = require(path.resolve(path.join(process.cwd(), 'modules', 'clever-orm', 'config', 'default.json')))
        , env     = conf.environment.toLowerCase()
        , file    = path.join(process.cwd(), 'config', env + '.json');

      if (fs.existsSync(file)) {
        obj = underscore.extend(obj, require(file));
      }

      obj['clever-orm'] = obj['clever-orm'] || {};

      Object.keys(conf).forEach(function (key) {
        if (['host', 'dialect', 'port'].indexOf(key) > -1) {
          obj['clever-orm'].db.options = obj['clever-orm'].db.options || {};
          obj['clever-orm'].db.options[key] = conf[key];
        } else {
          obj['clever-orm'].db[key] = conf[key];
        }
      });

      fs.writeFileSync(file, JSON.stringify(obj, null, '  '));
    });
  }];
};
