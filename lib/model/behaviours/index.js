var path = require('path');

module.exports = {
  softDeleteable : require(path.resolve(path.join(__dirname, 'softDeleteable'))),
  timeStampable  : require(path.resolve(path.join(__dirname, 'timeStampable')))
};