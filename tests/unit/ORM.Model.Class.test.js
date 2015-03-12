var path        = require('path')
  , injector    = require('injector')
  , underscore  = require('underscore')
  , Model       = injector.getInstance('Model')
  , expect      = require( 'chai' ).expect
  , ormModel    = path.resolve(path.join(__dirname, '..', 'assets', 'OrmModel.js'))
  , ormModel    = require(ormModel)
  , OrmModel;

describe('Object Relational Mapper: (ORM)', function() {
  before(function(done) {
    injector.inject(ormModel, function(_OrmModel) {
      OrmModel = _OrmModel;
      injector.instance('OrmModel', OrmModel);
      
      injector
        .getInstance('sequelize')
        .sync({force:true})
        .then(function() {
          done();
        })
        .catch(done);
    });
  });

  describe('Extending', function() {
    it('Should have defined OrmModel as a Model', function(done) {
      expect(OrmModel.prototype instanceof Model).to.equal(true);

      done();
    });

    it.skip('Should have defined Orms table in MySQL', function(done) {
      injector.getInstance('sequelize').query('describe ' + OrmModel.entity.tableName + ';', { raw: true })
        .then(function(desc) {
          var modelSchemaKeys = Object.keys(OrmModel.fields).map(function(fieldName) {
            var field = OrmModel.fields[ fieldName ];
            return field.field ? field.field : fieldName;
          });
          expect(Object.keys(JSON.parse(JSON.stringify(desc)))).to.eql(modelSchemaKeys);
          done();
        })
        .catch(done);
    });
  });

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

      it('Should have defined OrmModel as a Model', function(done) {
        expect(OrmModel.prototype instanceof Model).to.equal(true);

        done();
      });

      it('String', function(done) {
        expect(OrmModel.fields).to.have.property('str');
        expect(OrmModel.fields.str).to.eql(String);

        done();
      });

      it('Number', function(done) {
        expect(OrmModel.fields).to.have.property('num');
        expect(OrmModel.fields.num).to.eql(Number);
        
        done();
      });

      it('Boolean', function(done) {
        expect(OrmModel.fields).to.have.property('bool');
        expect(OrmModel.fields.bool).to.eql(Boolean);
        
        done();
      });

      it('Date', function(done) {
        expect(OrmModel.fields).to.have.property('date');
        expect(OrmModel.fields.date).to.eql(Date);
        
        done();
      });

      it('Buffer', function(done) {
        expect(OrmModel.fields).to.have.property('buf');
        expect(OrmModel.fields.buf).to.eql(Buffer);

        done();
      });
      
      describe('Types.ENUM', function() {
        it('Should have Enum field', function(done) {
          expect(OrmModel.fields).to.have.property('enum');
          expect(OrmModel.fields.enum).to.have.property('type');
          expect(OrmModel.fields.enum.type.toString()).to.equal('ENUM');
          expect(OrmModel.fields.enum).to.have.property('values');
          expect(OrmModel.fields.enum.values).to.be.an('array');
          expect(OrmModel.fields.enum.values.length).to.equal(1);
          expect(OrmModel.fields.enum.values[ 0 ]).to.equal('test');

          done();
        });

        it('Should have Enum (defined by object notation) field', function(done) {
          expect(OrmModel.fields).to.have.property('enumObj');
          expect(OrmModel.fields.enumObj).to.have.property('type');
          expect(OrmModel.fields.enumObj.type.toString()).to.equal('ENUM');
          expect(OrmModel.fields.enumObj).to.have.property('values');
          expect(OrmModel.fields.enumObj.values).to.be.an('array');
          expect(OrmModel.fields.enumObj.values.length).to.equal(1);
          expect(OrmModel.fields.enumObj.values[ 0 ]).to.equal('test');

          done();
        });
      });

      it.skip('Types.TINYINT');

      // it.skip('Should have Enum (defined by object notation) field');

      describe('BIGINT', function() {
        it('Should have bigint field', function(done) {
          expect(OrmModel.fields).to.have.property('bigint');
          expect(OrmModel.fields.bigint.toString()).to.equal('BIGINT');

          done();
        });

        it('Should have bigint with length field', function(done) {
          expect(OrmModel.fields).to.have.property('bigintLen');
          expect(OrmModel.fields.bigintLen).to.have.property('length');
          expect(OrmModel.fields.bigintLen.length).to.equal(11);
          expect(OrmModel.fields.bigintLen.type.toString()).to.equal('BIGINT');

          done();
        });
      });

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
    describe('create()', function() {
      it('Should be able to create a new model instance', function(done) {
        var entity = {
          str             : 'String',
          bool            : true,
          date            : new Date(),
          enum            : 'test',
          enumObj         : 'test',
          buf             : new Buffer('foobar'),
          bigint          : 1000000001,
          bigintLen       : 1000000001,
          float           : 10.1,
          floatLen        : 100000000.1,
          floatLenAndDec  : 1.12345678911,
          dec             : 10,
          decPrec         : 10,
          decPrecAndScale : 10,
          text            : 'Text',
          textObj         : 'TextObj'
        };

        OrmModel
          .create(underscore.clone(entity))
          .then(function(model) {
            Object.keys(entity).forEach(function(key) {
              expect(model[ key ]).to.eql(entity[ key ]);
            });
            done();
          })
          .catch(done);
      });
    });
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
      });
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
      });
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
      });
    });
  });
});