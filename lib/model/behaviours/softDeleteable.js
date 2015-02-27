'use strict';

module.exports.whereCriteria = function softDeleteableCriteria(findOptions, queryOptions, callback) {
  var columnName = this.deletedAt
    , where      = findOptions.where;

  if (!where) {
    findOptions.where = where = {};
  }

  if (!!this.softDeleteable) {
    var deletedAt = where[columnName];

    if (deletedAt === undefined || deletedAt === false) {
      where[columnName] = null;
    } else if (deletedAt === true) {
      where[columnName] = {
        $ne: null
      }
    } else if (typeof deletedAt === 'string' && !deletedAt instanceof Date) {
      where[columnName] = new Date(deletedAt);
    }
  }

  if (callback) {
    callback(null);
  }
}

module.exports.restore = function() {
  
}