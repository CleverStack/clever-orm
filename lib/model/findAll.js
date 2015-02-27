'use strict';

var path       = require('path')
  , async      = require('async')
  , util       = require('util')
  , utils      = require('utils')
  , underscore = require('underscore')
  , inspect    = utils.helpers.debugInspect
  , hydrator   = require(path.resolve(path.join(__dirname, 'instance', 'hydrator')))
  , eager      = require(path.resolve(path.join(__dirname, 'associations', 'loaders', 'eager')));

module.exports = function findAllModels(findOptions, queryOptions, callback) {
  if (this.debug.enabled) {
    this.debug(util.format('ormUtils.findAll(%s)', inspect(underscore.clone(findOptions.where))));
  }

  eager
    .load
    .apply(this, [findOptions, queryOptions]);

  this
    .entity
    .findAll(findOptions, queryOptions)
    .then(this.callback(function(results) {
      results = async.map(
        results instanceof Array ? results : [results],
        this.callback(hydrator, findOptions),
        callback
      );
    }))
    .catch(callback);
}