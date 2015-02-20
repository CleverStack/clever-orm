var injector    = require( 'injector' )
  , Sequelize   = require( 'sequelize' )
  , Module      = require( 'classes' ).Module
  , Model       = require( 'classes' ).Model
  , Promise     = require( 'bluebird' )
  , async       = require( 'async' )
  , _           = require( 'underscore' )
  , i           = require( 'i' )();

module.exports = Module.extend({

    models: {},

    sequelize: null,

    preSetup: function() {
        this.debug( 'Opening database connection to ' + this.config.db.options.dialect + '...' );

        if ( !!this.config.db.options.logging ) {
            this.config.db.options.logging = console.log;
        }

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

        var models  = require( 'models' );

        Object.keys( this.models ).forEach( this.proxy( function( modelName ) {
            var model = this.models[ modelName ]
              , Model = models[ modelName ];

            Object.keys( model.associations ).forEach( this.proxy( function( assocationName ) {
                var association = model.associations[ assocationName ];

                models[ association.source.name ].getters[ association.identifier ] = function() {
                    if ( association.identifier === 'id' && Model.type.toLowerCase() === 'odm' ) {
                        return this.entity._id;
                    } else {
                        return this.entity[ association.identifier ];
                    }
                }

                var as = i[ association.associationType === 'HasMany' ? 'pluralize' : 'singularize' ]( association.as );
                models[ association.source.name ].getters[ as ] = function() {
                    return this.entity[ as ];
                }

                models[ association.source.name ].setters[ association.identifier ] = 
                models[ association.source.name ].setters[ as ] = function( val ) {
                    this.entity[ association.as ] = val;
                };

                Object.keys( association.accessors ).forEach( function( accessorName ) {
                    var accessor = association.accessors[ accessorName ];

                    if ( typeof model.DAO.prototype[ accessor ] === 'function' ) {
                        Model.prototype[ accessor ] = function( where, options ) {
                            return new Promise( function( resolve, reject ) {
                                if ( !/has/.test( accessor ) ) {
                                    where   = where || {};
                                    options = options ? _.clone( options ) : {};

                                    if ( where.entity ) {
                                        where = where.entity;
                                    } else if ( where instanceof Array && where[ 0 ].entity ) {
                                        where = where.map( function( entity ) {
                                            return entity.entity;
                                        });
                                    }

                                    if ( !!options && options.save === false ) {
                                        this.entity[ accessor ]( where, options );
                                        resolve(this);
                                    } else {
                                        this.entity[ accessor ]( where, options )
                                            .then( function( entity ) {
                                                if (/set/.test(accessor) && this.entity[ as ]) {
                                                    this.entity[ as ].entity = where;
                                                    resolve( this );
                                                } else {
                                                    resolve( entity );
                                                }
                                            }.bind(this))
                                            .catch( reject );
                                    }
                                } else {
                                    this.entity[ accessor ].then( resolve ).catch( reject );
                                }
                            }.bind( this ))
                        }
                    }
                });
            }));
        }));
    },

    defineModelAssociations: function( modelName, assocType ) {
        var associatedWith = this.config.modelAssociations[ modelName ][ assocType ];
        if ( ! associatedWith instanceof Array ) {
            associatedWith = [ associatedWith ];
        }

        associatedWith.forEach( this.proxy( 'associateModels', modelName, assocType ) );
    },

    associateModels: function( sourceModelName, assocType, assocTo ) {
        assocTo = assocTo instanceof Array ? _.clone(assocTo) : [assocTo, {}];

        var targetModelName     = assocTo.shift()
          , associationOptions  = assocTo.shift()
          , sourceModel         = injector.getInstance(sourceModelName + 'Model')
          , targetModel         = injector.getInstance((associationOptions.through ? associationOptions.through : targetModelName) + 'Model')
          , as                  = associationOptions.as || targetModelName.replace('Model','');

        if ( associationOptions.through ) {
            associationOptions.through =  this.models[ associationOptions.through.replace( 'Model', '' ) ];
        }

        this.debug( '%s %s %s %s', sourceModelName, assocType, targetModelName, associationOptions);
        this.models[ sourceModelName ][ assocType ]( this.models[targetModelName], associationOptions );

        if (associationOptions.autoHooks !== false) {
            injector.getInstance('moduleLoader').on( 'routesInitialized', function() {
                if (assocType === 'belongsTo') {
                    sourceModel.on('beforeCreate', function(modelData, queryOptions, callback) {
                        if (modelData[as] !== undefined && modelData[as].entity === undefined && (typeof modelData[as] !== 'object' || modelData[as][targetModel.primaryKey[0]] === undefined)) {
                            targetModel
                                .find(typeof modelData[as] === 'object' ? _.clone(modelData[as]) : modelData[as], queryOptions)
                                .then(function(instance) {
                                    modelData[as] = instance;
                                    callback(null);
                                })
                                .catch(callback);
                        } else {
                            callback(null);
                        }
                    });

                    sourceModel.on('afterCreate', function(instance, modelData, queryOptions, callback) {
                        if (modelData[as] !== undefined && modelData[as].entity !== undefined) {
                            instance.entity[as]        = modelData[as];
                            instance.entity.values[as] = modelData[as];

                            callback(null);
                        } else {
                            callback(null);
                        }
                    });

                    // sourceModel.on('beforeUpdate', function(modelData, queryOptions, callback) {
                    //     if (modelData[as] !== undefined && modelData[as].entity === undefined && (typeof modelData[as] !== 'object' || modelData[as][targetModel.primaryKey[0]] === undefined)) {
                    //         targetModel
                    //             .find(typeof modelData[as] === 'object' ? _.clone(modelData[as]) : modelData[as], queryOptions)
                    //             .then(function(instance) {
                    //                 modelData[as] = instance;
                    //                 callback(null);
                    //             })
                    //             .catch(callback);
                    //     } else {
                    //         callback(null);
                    //     }
                    // });
                } else if (assocType === 'hasMany') {
                    sourceModel.on('afterCreate', function(instance, modelData, queryOptions, callback) {
                        var association = instance.Class.entity.associations[as];

                        // handle single association creation via the singular name
                        // handle multiple association create via the plural name as an array of models
                        // support nested association hasMany creation (plural and singular) with "Through", findBy ?
                        // allow mapping of requestFields that will be used for create
                        // allow definition of finders?

                        if (modelData[as] !== undefined && modelData[as] instanceof Array && modelData[as].length) {
                            async.map(
                                modelData[as],
                                function createNestedHasManyModel(nestedModelData, done) {
                                    var data = _.extend(
                                        typeof nestedModelData === 'object' ? _.clone(nestedModelData) : { label: nestedModelData },
                                        _.pick(instance, association.options.foreignKey)
                                    );

                                    targetModel.create(data, queryOptions).then(function(targetInstance) {
                                        done(null, targetInstance);
                                    })
                                    .catch(done);
                                },
                                function createdNestedHasManyModels(err, associations) {
                                    if (!err) {
                                        instance.entity[as]        = associations;
                                        instance.entity.values[as] = associations;

                                        callback(null);
                                    } else {
                                        callback(err);
                                    }
                                }
                            );
                        } else {
                            callback(null);
                        }
                    });

                    // sourceModel.on('afterUpdate')
                } else if (assocType === 'hasOne') {
                    sourceModel.on('afterCreate', function(instance, modelData, queryOptions, callback) {
                        var association = instance.Class.entity.associations[as];

                        if (modelData[as] !== undefined && modelData[as].entity === undefined && typeof modelData[as] === 'object') {
                            var data = _.extend(
                                typeof modelData[as] === 'object' ? _.clone(modelData[as]) : { label: modelData[as] },
                                _.pick(instance, association.options.foreignKey)
                            );

                            targetModel.create(data, queryOptions).then(function(targetInstance) {
                                instance.entity[as]        = targetInstance;
                                instance.entity.values[as] = targetInstance;

                                callback(null);
                            })
                            .catch(callback);
                        } else {
                            callback(null);
                        }
                    });
                }
            });
        }
    },

    parseModelSchema: function( Static ) {
        var parseDebug = this.proxy(function( msg ) { 
                this.debug( Static.modelName + 'Model: ' + msg ); 
            })
          , sequelizeConf = { paranoid: false, timestamps: false }
          , fields = {};

        if ( this.models[ Static.modelName ] !== undefined ) {
            parseDebug( 'Returning previously parsed and generated model...' );
            return this.models[ Static.modelName ];
        }

        parseDebug( 'Parsing schema for model...' );
        Object.keys( Static.fields ).forEach( this.proxy( 'defineField', Static, fields ) );
    
        parseDebug( 'Configuring static object for sequelize...' );

        this.setupOptions( parseDebug, sequelizeConf, Static );

        this.setupBehaviours( parseDebug, sequelizeConf, Static );

        // @TODO this is a templ hack to get functions available for queries
        Static.fn = this.sequelize.fn;
        Static.col = this.sequelize.col;

        parseDebug( 'Setting sequelize as the connection (adapter) for the Model...' );
        Static.connection = this.sequelize;

        parseDebug( 'Generating new sequelize model using computed schema...' );
        var model = this.sequelize.define( Static.modelName, fields, sequelizeConf );

        parseDebug( 'Caching completed native model...' );
        this.models[ Static.modelName ] = model;

        return model;
    },

    setupOptions: function( parseDebug, sequelizeConf, Static ) {
        parseDebug( 'Setup options...' );

        if ( Static.dbName !== false  ) {
            parseDebug( 'Setting dbName=' + Static.dbName + ' (sequelize tableName option)...' );
            sequelizeConf.tableName = Static.dbName;
        }

        if ( Static.freezeDbName !== false ) {
            parseDebug( 'Setting freezeDbName=' + Static.freezeDbName + ' (sequelize freezeTableName option)...' );
            sequelizeConf.freezeTableName = Static.freezeDbName;
        }

        if ( Static.underscored !== undefined ) {
            parseDebug( 'Setting underscored=' + Static.underscored + '...' );
            sequelizeConf.underscored = Static.underscored;
        }

        if ( Static.engine !== false ) {
            parseDebug( 'Setting engine=' + Static.engine + '...' );
            sequelizeConf.engine = Static.engine;
        }

        if ( Static.charset !== false  ) {
            parseDebug( 'Setting charset=' + Static.charset + '...' );
            sequelizeConf.charset = Static.charset;
        }

        if ( Static.comment !== false  ) {
            parseDebug( 'Setting comment=' + Static.comment + '...' );
            sequelizeConf.comment = Static.comment;
        }

        if ( Static.collate !== false  ) {
            parseDebug( 'Setting collate=' + Static.collate + '...' );
            sequelizeConf.collate = Static.collate;
        }

        if ( Static.indexes !== false ) {
            parseDebug( 'Setting indexes...' );
            sequelizeConf.indexes = Static.indexes;
        }
    },

    setupBehaviours: function( parseDebug, sequelizeConf, Static ) {
        parseDebug( 'Setup behaviours...' );

        if ( !!Static.softDeletable ) {
            parseDebug( 'is softDeletable (' + Static.deletedAt + ')' );

            sequelizeConf.paranoid = Static.softDeletable;
            sequelizeConf.deletedAt = Static.deletedAt;

            if ( Static.deletedAt !== 'deletedAt' ) {
                Static.aliases.push({
                    key         : 'deletedAt',
                    columnName  : Static.deletedAt
                });
            }
        }

        if ( !!Static.timeStampable ) {
            parseDebug( 'is timeStampable (' + Static.timeStampable + ')' );

            sequelizeConf.timestamps = Static.timeStampable;
            sequelizeConf.createdAt = Static.createdAt;
            sequelizeConf.updatedAt = Static.updatedAt;
        }
    },

    defineField: function( Static, fields, name ) {
        var fieldDefinition = {}
          , columnName      = name
          , options         = Static.fields[ name ]

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
        fieldDefinition.type = this.getFieldType( Static, options, name );

        if ( options.columnName ) {
            columnName      = options.columnName;
            options.field   = columnName;
        } else if ( !!Static.underscored && i.underscore( name ).split( '_' ).length > 1 ) {
            columnName      = i.underscore( name );
            options.field   = columnName;
        }

        // Handle options
        [ 'allowNull', 'primaryKey', 'autoIncrement', 'unique', 'default', 'comment' ].forEach(function( optionName ) {
            if ( options[ optionName ] !== undefined ) {
                if ( optionName === 'primaryKey' ) {
                    Static.primaryKeys.push( name );
                    if (!Static.primaryKey) {
                        Static.hasPrimaryKey = true;
                        Static.singlePrimaryKey = true;
                        Static.primaryKey = name;
                    } else {
                        Static.singlePrimaryKey = false;
                    }
                }

                fieldDefinition[ optionName === 'default' ? 'defaultValue' : optionName ] = options[ optionName ];
            }
        });

        fields[ columnName ] = fieldDefinition;
    },

    getFieldType: function( Static, options, name ) {
        var field;

        switch( options.type.type || options.type ) {

        case Number:
            field = this.numberType( options );
            break;
        case String:
            if ( options.length ) {
                field = Sequelize.STRING( options.length );
            } else {
                field = Sequelize.STRING;
            }
            break;
        case Boolean:
            field = Sequelize.BOOLEAN;
            break;
        case Date:
            field = Sequelize.DATE;
            break;
        case Array:
            field = options.of ? Sequelize.ARRAY( this.getFieldType( Static, { type: options.of } ) ) : Sequelize.ARRAY( Sequelize.STRING );
            break;
        case Buffer:
            field = Sequelize.STRING.BINARY;
            break;
        case Model.Types.ENUM:
            field = Sequelize.ENUM( options.values );
            break;
        case Model.Types.TINYINT:
            field = this.tinyIntType( options );
            break;
        case Model.Types.BIGINT:
            field = this.bigIntType( options );
            break;
        case Model.Types.FLOAT:
            field = this.floatType( options );
            break;
        case Model.Types.DECIMAL:
            field = this.decimalType( options );
            break;
        case Model.Types.TEXT:
            field = Sequelize.TEXT;
            break;
        case undefined:
            throw new Error( [ 'You must define the type of field that', '"' + name + '"', 'is on the', '"' + Static.modelName + '" model' ].join( ' ' ) );
        default:
            throw new Error( [ 'You must define a valid type for the field named', '"' + name + '"', 'on the', '"' + Static.modelName + '" model' ].join( ' ' ) );
        }

        return field;
    },

    numberType: function( options ) {
        var field = !!options.length ? Sequelize.INTEGER( options.length ) : Sequelize.INTEGER;
        if ( !!options.unsigned && !!options.zerofill ) {
            field = field.UNSIGNED.ZEROFILL;
        } else if ( !!options.unsigned && !options.zerofill ) {
            field = field.UNSIGNED;
        } else if ( !options.unsigned && !!options.zerofill ) {
            field = field.ZEROFILL;
        }
        return field;
    },

    tinyIntType: function( options ) {
        var field = !!options.length ? 'TINYINT(' + options.length + ')' : 'TINYINT';
        if ( !!options.unsigned && !!options.zerofill ) {
            field += ' UNSIGNED ZEROFILL';
        } else if ( !!options.unsigned && !options.zerofill ) {
            field += ' UNSIGNED';
        } else if ( !options.unsigned && !!options.zerofill ) {
            field += ' ZEROFILL';
        }
        return field;
    },

    bigIntType: function( options ) {
        var field = !!options.length ? Sequelize.BIGINT( options.length ) : Sequelize.BIGINT;
        if ( !!options.unsigned && !!options.zerofill ) {
            field = field.UNSIGNED.ZEROFILL;
        } else if ( !!options.unsigned && !options.zerofill ) {
            field = field.UNSIGNED;
        } else if ( !options.unsigned && !!options.zerofill ) {
            field = field.ZEROFILL;
        }
        return field;
    },

    floatType: function( options ) {
        var field = Sequelize.FLOAT;
        if ( !!options.decimals ) {
            field = Sequelize.FLOAT( options.length, options.decimals );
        } else if ( !!options.length ) {
            field = Sequelize.FLOAT( options.length );
        }

        if ( !!options.unsigned && !!options.zerofill ) {
            field = field.UNSIGNED.ZEROFILL;
        } else if ( !!options.unsigned && !options.zerofill ) {
            field = field.UNSIGNED;
        } else if ( !options.unsigned && !!options.zerofill ) {
            field = field.ZEROFILL;
        }
        return field;
    },

    decimalType: function( options ) {
        var field = Sequelize.DECIMAL;
        if ( !!options.scale ) {
            field = Sequelize.DECIMAL( options.precision, options.scale );
        } else if ( !!options.precision ) {
            field = Sequelize.DECIMAL( options.precision );
        }
        return field;
    }
});