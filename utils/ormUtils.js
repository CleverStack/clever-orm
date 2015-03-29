var utils = require('utils')
  , model = utils.model.orm;

// @todo remove the dependency on this file
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
  afterEagerLoad  : model.associations.loaders.eager.afterLoad
};