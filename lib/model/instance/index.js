var path = require('path');

module.exports = {
  save     : require(path.resolve(path.join(__dirname, 'save'))),
  destroy  : require(path.resolve(path.join(__dirname, 'destroy'))),
  hydrator : require(path.resolve(path.join(__dirname, 'hydrator'))),
  setup    : require(path.resolve(path.join(__dirname, 'setup')))
};