var path = require('path');

module.exports = {
  lazy  : require(path.resolve(path.join(__dirname, 'lazy'))),
  eager : require(path.resolve(path.join(__dirname, 'eager')))
};