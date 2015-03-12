module.exports.load = function(sourceModel, assocType, targetModel, alias/*, association*/) {
  var lazilyLoadedIncludes;

  // Grab any of the includes for a find() before eager loading them
  sourceModel.on('beforeFind', function(findOptions, queryOptions, callback) {
    findOptions.include.every(function(include, includeIndex) {
      if (include.as === alias) {
        lazilyLoadedIncludes = include;
        findOptions.include.splice(includeIndex, 1);
        return false;
      }
      return true;
    });

    callback(null, findOptions);
  });

  // Call a finder method to lazy load the result
  sourceModel.on('afterFind', function(instance, findOptions, queryOptions, callback) {
    var association       = instance.Class.entity.associations[alias]
      , accessor          = association.accessors.get
      , targetFindOptions = {};


    if (lazilyLoadedIncludes) {
      targetFindOptions.include = targetFindOptions.include || [];
      targetFindOptions.include.push(lazilyLoadedIncludes);
    }

    instance[accessor].apply(instance, [targetFindOptions, queryOptions]).then(function(){
      callback(null);
    })
    .catch(callback);
  });
};