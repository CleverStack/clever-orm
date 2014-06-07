var mongoose        = require( 'mongoose' )
  , injector        = require( 'injector' )
  , Sequelize       = require( 'sequelize' )
  , Module          = require( 'classes' ).Module;

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
        Object.keys( Static._schema ).forEach(function( name ) {
            var options = Static._schema[ name ]
              , fieldDefinition = {};

            // If a type has been specified outside of the object, handle that
            if ( typeof options !== 'object' ) {
                options = {
                    type: options
                }
            }

            // Figure out the type mapping for sequelizejs
            if ( options.type === undefined ) {
                throw new Error( [ 'You must define the type of field that', '"' + name + '"', 'is on the', '"' + Static.name + '" model' ].join( ' ' ) );
            } else if ( options.type === Number ) {
                fieldDefinition.type = Sequelize.INTEGER;
            } else if ( options.type === String ) {
                fieldDefinition.type = Sequelize.STRING;
            } else if ( options.type === Boolean ) {
                fieldDefinition.type = Sequelize.BOOLEAN;
            } else if ( options.type === Date ) {
                fieldDefinition.type = Sequelize.DATE;
            } else {
                throw new Error( [ 'You must define a valid type for the field named', '"' + name + '"', 'on the', '"' + Static.name + '" model' ].join( ' ' ) );
            }

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
        });
    
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
    }
});