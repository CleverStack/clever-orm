module.exports = function ( Model, config ) {
    return Model.extend( 'Orm',
    {
        type: 'ORM',
        softDeletable: true,
        timeStampable: true
    },
    {
        id: {
            type: Number,
            primaryKey: true,
            autoIncrement: true
        },
        str: String,
        bool: Boolean,
        date: Date,
        enum: Model.Types.ENUM( 'test' ),
        enumObj: {
            type: Model.Types.ENUM,
            values: [ 'test' ]
        },
        buf: Buffer,
        bigint: Model.Types.BIGINT,
        bigintLen: Model.Types.BIGINT( 11 ),
        float: Model.Types.FLOAT,
        floatLen: Model.Types.FLOAT( 11 ),
        floatLenAndDec: Model.Types.FLOAT( 11, 10 ),
        dec: Model.Types.DECIMAL,
        decPrec: Model.Types.DECIMAL( 11 ),
        decPrecAndScale: Model.Types.DECIMAL( 10, 2 ),
        text: Model.Types.TEXT,
        textObj: {
            type: Model.Types.TEXT,
            required: true
        }
    });
};