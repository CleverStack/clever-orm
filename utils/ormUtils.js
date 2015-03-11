var path     = require('path')
  , ormLib   = require(path.resolve(path.join(__dirname, '..', 'lib')))
  , model    = ormLib.model

module.exports  = {
  find            : model.find,
  save            : model.instance.save,
  create          : model.create,
  update          : model.update,
  destroy         : model.destroy,
  destroyInstance : model.instance.destroy,
  findAll         : model.findAll,
  wrapModel       : model.instance.hydrator,
  setup           : model.instance.setup,
  eagerLoad       : model.associations.loaders.eager.load,
  afterEagerLoad  : model.associations.loaders.eager.afterLoad,
  softDeleteable  : model.behaviours.softDeleteable.whereCriteria
};