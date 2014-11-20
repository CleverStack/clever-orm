var utils       = require( 'utils' )
  , env         = utils.bootstrapEnv()
  , path        = require( 'path' )
  , expect      = require( 'chai' ).expect
  , injector    = require( 'injector' )
  , Model       = injector.getInstance( 'Model' )
  , packageJson = injector.getInstance( 'packageJson' )
  , ormModel   = path.resolve( path.join( __dirname, '..', 'assets', 'OrmModel.js' ) )
  , ormModel   = require( ormModel )
  , OrmModel;

describe( 'test.ORM.Model', function() {

    before( function( done ) {
        injector.inject( ormModel, function( _OrmModel ) {
            OrmModel = _OrmModel;
            injector.instance( 'OrmModel', OrmModel );
            
            // run a sync
            injector.getInstance( 'sequelize' ).sync({force:true})
                .then(function() {
                    done();
                })
                .catch( done );
        });
    });

    describe( 'Definition', function() {
        it( 'Should have defined OrmModel as a Model', function( done ) {
            expect( OrmModel.prototype instanceof Model ).to.equal( true );

            done();
        });

        it( 'Should have String field', function( done ) {
            expect( OrmModel._schema ).to.have.property( 'str' );
            expect( OrmModel._schema.str ).to.eql( String );

            done();
        });

        it( 'Should have Boolean field', function( done ) {
            expect( OrmModel._schema ).to.have.property( 'bool' );
            expect( OrmModel._schema.bool ).to.eql( Boolean );
            
            done();
        });

        it( 'Should have Date field', function( done ) {
            expect( OrmModel._schema ).to.have.property( 'date' );
            expect( OrmModel._schema.date ).to.eql( Date );
            
            done();
        });

        it( 'Should have Enum field', function( done ) {
            expect( OrmModel._schema ).to.have.property( 'enum' );
            expect( OrmModel._schema.enum ).to.have.property( 'type' );
            expect( OrmModel._schema.enum.type.toString() ).to.equal( 'ENUM' );
            expect( OrmModel._schema.enum ).to.have.property( 'values' );
            expect( OrmModel._schema.enum.values ).to.be.an( 'array' );
            expect( OrmModel._schema.enum.values.length ).to.equal( 1 );
            expect( OrmModel._schema.enum.values[ 0 ] ).to.equal( 'test' );

            done();
        });

        it( 'Should have Enum (defined by object notation) field', function( done ) {
            expect( OrmModel._schema ).to.have.property( 'enumObj' );
            expect( OrmModel._schema.enumObj ).to.have.property( 'type' );
            expect( OrmModel._schema.enumObj.type.toString() ).to.equal( 'ENUM' );
            expect( OrmModel._schema.enumObj ).to.have.property( 'values' );
            expect( OrmModel._schema.enumObj.values ).to.be.an( 'array' );
            expect( OrmModel._schema.enumObj.values.length ).to.equal( 1 );
            expect( OrmModel._schema.enumObj.values[ 0 ] ).to.equal( 'test' );

            done();
        });

        it( 'Should have Buffer field', function( done ) {
            expect( OrmModel._schema ).to.have.property( 'buf' );
            expect( OrmModel._schema.buf ).to.eql( Buffer );

            done();
        });

        it( 'Should have bigint field', function( done ) {
            expect( OrmModel._schema ).to.have.property( 'bigint' );
            expect( OrmModel._schema.bigint.toString() ).to.equal( 'BIGINT' );

            done();
        });

        it( 'Should have bigint with length field', function( done ) {
            expect( OrmModel._schema ).to.have.property( 'bigintLen' );
            expect( OrmModel._schema.bigintLen ).to.have.property( 'length' );
            expect( OrmModel._schema.bigintLen.length ).to.equal( 11 );
            expect( OrmModel._schema.bigintLen.type.toString() ).to.equal( 'BIGINT' );

            done();
        });

        it( 'Should have defined Orms table in MySQL', function( done ) {
            injector.getInstance( 'sequelize' ).query( 'describe Orms;', { raw: true })
                .success(function( desc ) {
                    expect( JSON.stringify( desc ) ).to.equal( '{"id":{"type":"INT(11)","allowNull":false,"defaultValue":null},"str":{"type":"VARCHAR(255)","allowNull":true,"defaultValue":null},"bool":{"type":"TINYINT(1)","allowNull":true,"defaultValue":null},"date":{"type":"DATETIME","allowNull":true,"defaultValue":null},"enum":{"type":"ENUM(\'TEST\')","allowNull":true,"defaultValue":null},"enumObj":{"type":"ENUM(\'TEST\')","allowNull":true,"defaultValue":null},"buf":{"type":"VARCHAR(255)","allowNull":true,"defaultValue":null},"bigint":{"type":"BIGINT(20)","allowNull":true,"defaultValue":null},"bigintLen":{"type":"BIGINT(11)","allowNull":true,"defaultValue":null},"float":{"type":"FLOAT","allowNull":true,"defaultValue":null},"floatLen":{"type":"FLOAT","allowNull":true,"defaultValue":null},"floatLenAndDec":{"type":"FLOAT(11,10)","allowNull":true,"defaultValue":null},"dec":{"type":"DECIMAL(10,0)","allowNull":true,"defaultValue":null},"decPrec":{"type":"DECIMAL(11,0)","allowNull":true,"defaultValue":null},"decPrecAndScale":{"type":"DECIMAL(10,2)","allowNull":true,"defaultValue":null},"text":{"type":"TEXT","allowNull":true,"defaultValue":null},"textObj":{"type":"TEXT","allowNull":true,"defaultValue":null},"createdAt":{"type":"DATETIME","allowNull":true,"defaultValue":null},"updatedAt":{"type":"DATETIME","allowNull":true,"defaultValue":null},"deletedAt":{"type":"DATETIME","allowNull":true,"defaultValue":null}}' );
                    done();
                })
                .error( done )
        });
    });


    describe( 'Usage', function() {
        it( 'Should be able to create a new model instance', function( done ) {
            var _model = {
                str             : 'String',
                bool            : true,
                date            : new Date(),
                enum            : 'test',
                enumObj         : 'test',
                buf             : new Buffer( 'foobar' ),
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
                .create( _model )
                .then( function( model ) {
                    Object.keys( _model ).forEach( function( key ) {
                        expect( model._model.dataValues[ key ] ).to.eql( _model[ key ] );
                    });
                    done();
                })
                .catch( done );
        });
    });
});