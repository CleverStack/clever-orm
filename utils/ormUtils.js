var path     = require('path')
  , ormLib   = require(path.resolve(path.join(__dirname, '..', 'lib')));

module.exports  = {
  find            : ormLib.model.find,
  save            : ormLib.model.instance.save,
  create          : ormLib.model.create,
  update          : ormLib.model.update,
  destroy         : ormLib.model.destroy,
  destroyInstance : ormLib.model.instance.destroy,
  findAll         : ormLib.model.findAll,
  wrapModel       : ormLib.model.instance.hydrator,
  eagerLoad       : ormLib.model.associations.loaders.eager.load,
  afterEagerLoad  : ormLib.model.associations.loaders.eager.afterLoad,
  softDeleteable  : ormLib.model.behaviours.softDeleteable.whereCriteria
};