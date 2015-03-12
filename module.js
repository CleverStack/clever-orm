var injector   = require('injector')
  , Sequelize  = require('sequelize')
  , path       = require('path')
  , debug      = require('debug')
  , Module     = injector.getInstance('Module')
  , Model      = injector.getInstance('Model')
  , inflect    = injector.getInstance('inflect')
  , ormLib     = require(path.resolve(path.join(__dirname, 'lib')));

module.exports = Module.extend(
{
  models: {},

  /**
   * A stored reference to the instance of sequelize that has a database connection
   * @type {Sequelize}
   */
  sequelize: null,

  /**
   * preSetup event hook, that gets emitted inside of this.setup() before anything is actually done,
   * this forms part of the constructor for this module.
   *
   * We use this hook to setup a connection to the DB (through sequelize) and to setup any and all
   * debugging options that are available.
   * 
   * @return {undefined}
   */
  preSetup: function() {
    var dbConfig    = this.config.db
      , queryLogger = debug('cleverstack:queryLog');

    if (!!dbConfig.options.logging || queryLogger.enabled) {
      if (!queryLogger.enabled) {
        debug.enable('cleverstack:queryLog');
        queryLogger = debug('cleverstack:queryLog');
      }
      dbConfig.options.logging = queryLogger;
    }

    if (this.debug.enabled) {
      this.debug('Opening database connection to ' + dbConfig.options.dialect + '...');
    }
    this.sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig.options);
  },

  /**
   * preInit event hook, that gets emitted inside of this.init() before anything is actually done,
   * this forms part of the constructor for this module.
   *
   * We use this hook to add sequelize dependencies into the injector
   * 
   * @return {undefined}
   */
  preInit: function() {
    injector.instance('Sequelize', Sequelize);
    injector.instance('sequelize', this.sequelize);
  },

  /**
   * modulesLoaded event hook, that gets emitted by the ModuleLoader after all modules,
   * have loaded, including all of their models, so now we can define all of their associations.
   *
   * After associating every model with their associated models we must emit the 'ready' event
   * so that the ModuleLoader can progress its load() further.
   * 
   * @return {undefined}
   */
  modulesLoaded: function() {
    ormLib.model.associations.define.apply(this, [this.config.modelAssociations]);
    this.emit('ready');
  },

  parseModelSchema: function(Static) {
    var parseDebug = this.proxy(function(msg) {
        this.debug(Static.modelName + 'Model: ' + msg);
      })
      , sequelizeConf = { paranoid: false, timestamps: false }
      , fields = {};

    if (this.models[Static.modelName] !== undefined) {
      parseDebug('Returning previously parsed and generated model...');
      return this.models[Static.modelName];
    }

    parseDebug('Parsing schema for model...');
    Object.keys(Static.fields).forEach(this.proxy('defineField', Static, fields));
  
    parseDebug('Configuring static object for sequelize...');

    this.setupOptions(parseDebug, sequelizeConf, Static);

    this.setupBehaviours(parseDebug, sequelizeConf, Static);

    // @TODO this is a templ hack to get functions available for queries
    Static.fn = this.sequelize.fn;
    Static.col = this.sequelize.col;

    parseDebug('Setting sequelize as the connection (adapter) for the Model...');
    Static.connection = this.sequelize;

    parseDebug('Generating new sequelize model using computed schema...');
    var model = this.sequelize.define(Static.modelName, fields, sequelizeConf);

    parseDebug('Caching completed native model...');
    this.models[Static.modelName] = model;

    return model;
  },

  setupOptions: function(parseDebug, sequelizeConf, Static) {
    parseDebug('Setup options...');

    if (Static.dbName !== false ) {
      parseDebug('Setting dbName=' + Static.dbName + ' (sequelize tableName option)...');
      sequelizeConf.tableName = Static.dbName;
    }

    if (Static.freezeDbName !== false) {
      parseDebug('Setting freezeDbName=' + Static.freezeDbName + ' (sequelize freezeTableName option)...');
      sequelizeConf.freezeTableName = Static.freezeDbName;
    }

    if (Static.underscored !== undefined) {
      parseDebug('Setting underscored=' + Static.underscored + '...');
      sequelizeConf.underscored = Static.underscored;
    }

    if (Static.engine !== false) {
      parseDebug('Setting engine=' + Static.engine + '...');
      sequelizeConf.engine = Static.engine;
    }

    if (Static.charset !== false ) {
      parseDebug('Setting charset=' + Static.charset + '...');
      sequelizeConf.charset = Static.charset;
    }

    if (Static.comment !== false ) {
      parseDebug('Setting comment=' + Static.comment + '...');
      sequelizeConf.comment = Static.comment;
    }

    if (Static.collate !== false ) {
      parseDebug('Setting collate=' + Static.collate + '...');
      sequelizeConf.collate = Static.collate;
    }

    if (Static.indexes !== false) {
      parseDebug('Setting indexes...');
      sequelizeConf.indexes = Static.indexes;
    }
  },

  setupBehaviours: function(parseDebug, sequelizeConf, Static) {
    parseDebug('Setup behaviours...');

    if (!!Static.softDeletable) {
      parseDebug('is softDeletable (' + Static.deletedAt + ')');

      sequelizeConf.paranoid = Static.softDeletable;
      sequelizeConf.deletedAt = Static.deletedAt;

      if (Static.deletedAt !== 'deletedAt') {
        Static.aliases.push({
          key         : 'deletedAt',
          columnName  : Static.deletedAt
        });
      }
    }

    if (!!Static.timeStampable) {
      parseDebug('is timeStampable (' + Static.timeStampable + ')');

      sequelizeConf.timestamps = Static.timeStampable;
      sequelizeConf.createdAt = Static.createdAt;
      sequelizeConf.updatedAt = Static.updatedAt;
    }
  },

  defineField: function(Static, fields, name) {
    var fieldDefinition = {}
      , columnName      = name
      , options         = Static.fields[name];

    // Allow direct syntax
    if (typeof options !== 'object' || options instanceof Array) {
      options = {
        type: options
      };
    }

    // Handle array of "Something"
    if (options.type instanceof Array || options.type === Array) {
      options.of = (options.type.length > 0 && options.type[0] !== undefined) ? options.type[0] : String;
      options.type = Array;
    }

    // Get the type
    fieldDefinition.type = this.getFieldType(Static, options, name);

    if (options.columnName) {
      columnName      = options.columnName;
      options.field   = columnName;
    } else if (!!Static.underscored && inflect.underscore(name).split('_').length > 1) {
      columnName      = inflect.underscore(name);
      options.field   = columnName;
    }

    // Handle options
    ['allowNull', 'primaryKey', 'autoIncrement', 'unique', 'default', 'comment'].forEach(function(optionName) {
      if (options[optionName] !== undefined) {
        if (optionName === 'primaryKey') {
          Static.primaryKeys.push(name);
          if (!Static.primaryKey) {
            Static.hasPrimaryKey = true;
            Static.singlePrimaryKey = true;
            Static.primaryKey = name;
          } else {
            Static.singlePrimaryKey = false;
          }
        }

        fieldDefinition[optionName === 'default' ? 'defaultValue' : optionName] = options[optionName];
      }
    });

    fields[columnName] = fieldDefinition;
  },

  getFieldType: function(Static, options, name) {
    var field;

    switch(options.type.type || options.type) {

    case Number:
      field = this.numberType(options);
      break;
    case String:
      if (options.length) {
        field = Sequelize.STRING(options.length);
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
      field = options.of ? Sequelize.ARRAY(this.getFieldType(Static, { type: options.of })) : Sequelize.ARRAY(Sequelize.STRING);
      break;
    case Buffer:
      field = Sequelize.STRING.BINARY;
      break;
    case Model.Types.ENUM:
      field = Sequelize.ENUM(options.values);
      break;
    case Model.Types.TINYINT:
      field = this.tinyIntType(options);
      break;
    case Model.Types.BIGINT:
      field = this.bigIntType(options);
      break;
    case Model.Types.FLOAT:
      field = this.floatType(options);
      break;
    case Model.Types.DECIMAL:
      field = this.decimalType(options);
      break;
    case Model.Types.TEXT:
      field = Sequelize.TEXT;
      break;
    case undefined:
      throw new Error(['You must define the type of field that', '"' + name + '"', 'is on the', '"' + Static.modelName + '" model'].join(' '));
    default:
      throw new Error(['You must define a valid type for the field named', '"' + name + '"', 'on the', '"' + Static.modelName + '" model'].join(' '));
    }

    return field;
  },

  numberType: function(options) {
    var field = !!options.length ? Sequelize.INTEGER(options.length) : Sequelize.INTEGER;
    if (!!options.unsigned && !!options.zerofill) {
      field = field.UNSIGNED.ZEROFILL;
    } else if (!!options.unsigned && !options.zerofill) {
      field = field.UNSIGNED;
    } else if (!options.unsigned && !!options.zerofill) {
      field = field.ZEROFILL;
    }
    return field;
  },

  tinyIntType: function(options) {
    var field = !!options.length ? 'TINYINT(' + options.length + ')' : 'TINYINT';
    if (!!options.unsigned && !!options.zerofill) {
      field += ' UNSIGNED ZEROFILL';
    } else if (!!options.unsigned && !options.zerofill) {
      field += ' UNSIGNED';
    } else if (!options.unsigned && !!options.zerofill) {
      field += ' ZEROFILL';
    }
    return field;
  },

  bigIntType: function(options) {
    var field = !!options.length ? Sequelize.BIGINT(options.length) : Sequelize.BIGINT;
    if (!!options.unsigned && !!options.zerofill) {
      field = field.UNSIGNED.ZEROFILL;
    } else if (!!options.unsigned && !options.zerofill) {
      field = field.UNSIGNED;
    } else if (!options.unsigned && !!options.zerofill) {
      field = field.ZEROFILL;
    }
    return field;
  },

  floatType: function(options) {
    var field = Sequelize.FLOAT;
    if (!!options.decimals) {
      field = Sequelize.FLOAT(options.length, options.decimals);
    } else if (!!options.length) {
      field = Sequelize.FLOAT(options.length);
    }

    if (!!options.unsigned && !!options.zerofill) {
      field = field.UNSIGNED.ZEROFILL;
    } else if (!!options.unsigned && !options.zerofill) {
      field = field.UNSIGNED;
    } else if (!options.unsigned && !!options.zerofill) {
      field = field.ZEROFILL;
    }
    return field;
  },

  decimalType: function(options) {
    var field = Sequelize.DECIMAL;
    if (!!options.scale) {
      field = Sequelize.DECIMAL(options.precision, options.scale);
    } else if (!!options.precision) {
      field = Sequelize.DECIMAL(options.precision);
    }
    return field;
  }
});