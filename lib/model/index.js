var path = require('path');

module.exports = {
  instance     : require(path.resolve(path.join(__dirname, 'instance'))),
  associations : require(path.resolve(path.join(__dirname, 'associations'))),

  create   : require(path.resolve(path.join(__dirname, 'create'))),
  find     : require(path.resolve(path.join(__dirname, 'find'))),
  findAll  : require(path.resolve(path.join(__dirname, 'findAll'))),
  update   : require(path.resolve(path.join(__dirname, 'update'))),
  destroy  : require(path.resolve(path.join(__dirname, 'destroy')))
};