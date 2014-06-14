var injector    = require( 'injector' )
  , Sequelize   = require( 'sequelize' )
  , Module      = require( 'classes' ).Module
  , Model       = require( 'classes' ).Model;

module.exports = Module.extend({

    models: {},

    sequelize: null,

    preSetup: function() {
        this.debug( 'Opening database connection to ' + this.config.db.options.dialect + '...' );

        this.sequelize = new Sequelize(
            this.config.db.database,
            this.config.db.username,
            this.config.db.password,
            this.config.db.options
        );
    },

    preInit: function() {
        this.debug( 'Adding Sequelize module and sequelize instance to the injector...' );

        injector.instance( 'Sequelize', Sequelize );
        injector.instance( 'sequelize', this.sequelize );
    },

    modulesLoaded: function() {
        this.defineModelsAssociations();
        this.emit( 'ready' );
    },

    defineModelsAssociations: function() {
        this.debug( 'Defining model assocations' );

        Object.keys( this.config.modelAssociations ).forEach( this.proxy( function( modelName ) {
            Object.keys( this.config.modelAssociations[ modelName ] ).forEach( this.proxy( 'defineModelAssociations', modelName ) );
        }));
    },

    defineModelAssociations: function( modelName, assocType ) {
        var associatedWith = this.config.modelAssociations[ modelName ][ assocType ];
        if ( ! associatedWith instanceof Array ) {
            associatedWith = [ associatedWith ];
        }

        associatedWith.forEach( this.proxy( 'associateModels', modelName, assocType ) );
    },

    associateModels: function( modelName, assocType, assocTo ) {
        // Support second argument
        if ( assocTo instanceof Array ) {
            this.debug( '%s %s %s with second argument of ', modelName, assocType, assocTo[0], assocTo[1] );
            this.models[ modelName ][ assocType ]( this.models[ assocTo[0] ], assocTo[1] );
        } else {
            this.debug( '%s %s %s', modelName, assocType, assocTo );
            this.models[ modelName ][ assocType ]( this.models[assocTo] );
        }
    },

    parseModelSchema: function( Static, Proto ) {
        var parseDebug = this.proxy(function( msg ) { 
                this.debug( Static._name + 'Model: ' + msg ); 
            })
          , sequelizeConf = {}
          , fields = {};

        if ( this.models[ Static._name ] !== undefined ) {
            parseDebug( 'Returning previously parsed and generated model...' );
            return this.models[ Static._name ];
        }

        parseDebug( 'Parsing schema for model...' );
        Object.keys( Static._schema ).forEach( this.proxy( 'parseSchemaField', Static, fields ) );
    
        parseDebug( 'Configuring static object for sequelize...' );
        sequelizeConf.paranoid = Static.softDeletable;
        sequelizeConf.timestamps = Static.timeStampable;

        parseDebug( 'Setting sequelize as the _db (adapter) for the Model...' );
        Static._db = this.sequelize;

        parseDebug( 'Generating new sequelize model using computed schema...' );
        var model = this.sequelize.define( Static._name, fields, sequelizeConf );

        parseDebug( 'Caching completed native model...' );
        this.models[ Static._name ] = model;

        return model;
    },

    parseSchemaField: function( Static, fields, name ) {
        var options = Static._schema[ name ]
          , fieldDefinition = {};

        // Allow direct syntax
        if ( typeof options !== 'object' || options instanceof Array ) {
            options = {
                type: options
            }
        }

        // Handle array of "Something"
        if ( options.type instanceof Array || options.type === Array ) {
            options.of = ( options.type.length > 0 && options.type[ 0 ] !== undefined ) ? options.type[ 0 ] : String;
            options.type = Array;
        }

        // Get the type
        fieldDefinition.type = this.getFieldType( Static, options );

        // Handle options
        [ 'allowNull', 'primaryKey', 'autoIncrement', 'unique', 'required', 'validate', 'default' ].forEach(function( optionName ) {
            if ( options[ optionName ] !== undefined ) {
                if ( optionName === 'primaryKey' ) {
                    Static.primaryKey = name;
                }

                fieldDefinition[ optionName === 'default' ? 'defaultValue' : optionName ] = options[ optionName ];
            }
        });

        fields[ name ] = fieldDefinition;
    },

    getFieldType: function( Static, options ) {
        switch( options.type ) {
            case Number:
                return Sequelize.INTEGER;
            case String:
                return Sequelize.STRING;
            case Boolean:
                return Sequelize.BOOLEAN;
            case Date:
                return Sequelize.DATE;
            case Array:
                return options.of ? Sequelize.ARRAY( this.getFieldType( Static, { type: options.of } ) ) : Sequelize.ARRAY( Sequelize.STRING );
            case Buffer:
                return Sequelize.STRING.BINARY;
            case Model.Types.ENUM:
                return Sequelize.ENUM( options.values );
            case Model.Types.BIGINT:
                return options.length ? Sequelize.BIGINT( options.length ) : Sequelize.BIGINT;
            case Model.Types.FLOAT:
                if ( !!options.decimals ) {
                    return Sequelize.FLOAT( options.length, options.decimals );
                } else if ( !!options.length ) {
                    return Sequelize.FLOAT( options.length );
                } else {
                    return Sequelize.FLOAT;
                }
            case Model.Types.DECIMAL:
                if ( !!options.scale ) {
                    return Sequelize.DECIMAL( options.precision, options.scale );
                } else if ( !!options.precision ) {
                    return Sequelize.DECIMAL( options.precision );
                } else {
                    return Sequelize.DECIMAL;
                }
            case Model.Types.TEXT:
                return Sequelize.TEXT;
            case undefined:
                throw new Error( [ 'You must define the type of field that', '"' + name + '"', 'is on the', '"' + Static.name + '" model' ].join( ' ' ) );
                break;
            default:
                throw new Error( [ 'You must define a valid type for the field named', '"' + name + '"', 'on the', '"' + Static.name + '" model' ].join( ' ' ) );
                break;
        }
    }
});