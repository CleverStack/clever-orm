var injector   = require('injector')
  , util       = require('util')
  , moduleLdr  = injector.getInstance('moduleLoader')
  , debug      = require('debug')('cleverstack:models:associations')
  , chalk      = require('chalk');

function defineNestedOperations(sourceModel, assocType, targetModel, alias, association) {
  /*jshint validthis: true */
  var events   = this[assocType]
    , eventNames;

  if (events && (eventNames = Object.keys(events)).length) {
    if (debug.enabled) {
      debug(util.format('%s %s %s autoHook Enabled!', sourceModel.modelName, assocType, targetModel.modelName));
    }

    moduleLdr.on('routesInitialized', function afterRoutesInitialized() {
      eventNames.forEach(function autoHookEvent(eventName) {
        var hook = events[eventName];

        if (debug.enabled) {
          debug(util.format('%s hook for relation (%s.%s.%s)%s', chalk.magenta(eventName), chalk.green(sourceModel.modelName), chalk.yellow(assocType), chalk.green(targetModel.modelName), alias ? ' with alias ' + chalk.red(alias) : ''));
        }
        sourceModel.on(eventName, sourceModel.callback(hook, alias, association, targetModel));
      });
    });
  }
}

module.exports = defineNestedOperations;