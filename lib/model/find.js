var path       = require('path')
  , util       = require('util')
  , utils      = require('utils')
  , underscore = require('underscore')
  , inspect    = utils.helpers.debugInspect
  , hydrator   = require(path.resolve(path.join(__dirname, 'instance', 'hydrator')))
  , eager      = require(path.resolve(path.join(__dirname, 'associations', 'loaders', 'eager')));

module.exports = function findModel(findOptions, queryOptions, callback) {
  if (this.debug.enabled) {
    this.debug(util.format('ormUtils.find(%s)', inspect(underscore.clone(findOptions.where))));
  }

  eager
    .load
    .apply(this, [findOptions, queryOptions]);

  this
    .entity
    .find(findOptions, queryOptions)
    .then(this.callback(function( model ) {
      hydrator.apply(this, [ findOptions, model, callback ]);
    }))
    .catch(callback);
};