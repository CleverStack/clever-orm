describe('Model', function() {
  describe('Options', function() {
    it.skip('type');
    it.skip('dbName');
    it.skip('engine');
    it.skip('charset');
    it.skip('comment');
    it.skip('collate');
    it.skip('indexes');
    it.skip('createdAt');
    it.skip('updatedAt');
    it.skip('deletedAt');
    it.skip('underscored');
    it.skip('versionable');
    it.skip('freezeDbName');
    it.skip('timeStampable');
    it.skip('softDeleteable');
  });

  describe('Fields', function() {
    describe('Types', function() {
      it.skip('String');
      it.skip('Number');
      it.skip('Boolean');
      it.skip('Date');
      it.skip('Buffer');
      it.skip('Types.ENUM');
      it.skip('Types.TINYINT');
      it.skip('Types.BIGINT');
      it.skip('Types.FLOAT');
      it.skip('Types.DECIMAL');
      it.skip('Types.TEXT');
    });
  });

  describe('Behaviours', function() {
    it.skip('softDeleteable');
    it.skip('timeStampable');
    it.skip('versionable');
  });

  describe('Methods', function() {
    it.skip('create()');
    it.skip('findOrCreate()');
    it.skip('update()');
    it.skip('findAndUpdate()');
    it.skip('destroy()');
    it.skip('findAndDestroy()');

    describe('finders', function() {
      it.skip('find()');
      it.skip('findAll()');
    });
  });

  describe('Associations', function() {
    it.skip('define');

    describe('belongsTo', function() {
      it.skip('define');

      describe('accessors', function() {
        it.skip('createAccessor');
        it.skip('getAccessor');
        it.skip('setAccessor');
      });

      describe('loaders', function() {
        it.skip('eager');
        it.skip('lazy');
      });

      describe('nestedOperations', function() {
        it.skip('beforeCreate');
        it.skip('afterCreate');
        it.skip('beforeUpdate');
        it.skip('afterUpdate');
      })
    });

    describe('hasOne', function() {
      it.skip('define');

      describe('accessors', function() {
        it.skip('createAccessor');
        it.skip('getAccessor');
        it.skip('setAccessor');
      });

      describe('loaders', function() {
        it.skip('eager');
        it.skip('lazy');
      });

      describe('nestedOperations', function() {
        it.skip('beforeCreate');
        it.skip('beforeUpdate');
      })
    });

    describe('hasMany', function() {
      it.skip('define');

      describe('accessors', function() {
        it.skip('createAccessor');
        it.skip('removeAccessor');
        it.skip('getAccessor');
        it.skip('setAccessor');
        it.skip('addAccessor');
      });

      describe('loaders', function() {
        it.skip('eager');
        it.skip('lazy');
      });

      describe('nestedOperations', function() {
        it.skip('afterCreate');
      })
    });
  });
});