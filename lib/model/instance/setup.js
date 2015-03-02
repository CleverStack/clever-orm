'use strict';

var utils      = require('utils')
  , defineProp = utils.helpers.defineProperty

module.exports = function setupModel(model) {
  if (!model instanceof this.Class.entity.Instance) {
    model = this.Class.entity.build(model);
  }
  defineProp(this, 'entity', {value: model});

  ['isDirty', 'isDeleted', 'isNewRecord', 'values', 'attributes'].forEach(this.proxy(function(prop) {
    defineProp(this, prop, this.proxy(function() {
      return this.entity[prop]; 
    }));
  }))

  defineProp(this, 'changed', this.proxy(function() {
    return this.entity.changed();
  }));

  return this._super.apply(this, [model]);
}