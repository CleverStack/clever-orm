var path       = require('path')
  , eager      = require(path.resolve(path.join(__dirname, '..', 'associations', 'loaders', 'eager')));
  
module.exports = function hydrateModel(findOptions, model, callback) {
  var ModelClass = this;

  if (model !== null) {
    model = new ModelClass(model);

    eager
      .afterLoad.apply(this, [findOptions, model]);

    return !callback ? model : callback( null, model );
  } else {
    return !callback ? null : callback( null, null );
  }
};