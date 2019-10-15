var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    Criteria = require("montage/core/criteria").Criteria,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    DataQuery = require("montage/data/model/data-query").DataQuery,
    DataStream = require("montage/data/service/data-stream").DataStream,
    Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    uuid = require("montage/core/uuid"),
    DataOrdering = require("montage/data/model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("montage/frb/evaluate"),
    Set = require("montage/collections/set"),
    XMLHttpRequest = require("xhr2"),
    querystring = require('querystring'),
    // Require sqlstring to add additional escaping capabilities
    sqlString = require('sqlstring'),
    // Require the aws-sdk. This is a dev dependency, so if being used
    // outside of a Lambda execution environment, it must be manually installed.
    // Todo check the new version of the SDK coming at:
    //  https://github.com/aws/aws-sdk-js-v3/tree/master/clients/node/client-rds-data-node
    //  https://www.npmjs.com/package/@aws-sdk/client-rds-data-node
    AWS = require('aws-sdk'),
    https = require('https'),
    PhrontService;



    /**********************************************************************/
    /** Enable HTTP Keep-Alive per https://vimeo.com/287511222          **/
    /** This dramatically increases the speed of subsequent HTTP calls  **/
    /**********************************************************************/
    const sslAgent = new https.Agent({
        keepAlive: true,
        maxSockets: 50, // same as aws-sdk
        rejectUnauthorized: true  // same as aws-sdk
    })
    sslAgent.setMaxListeners(0); // same as aws-sdk

/*
    var params = {
      resourceArn: "arn:aws:rds:us-west-2:537014313177:cluster:storephront-database", // required
      secretArn: "arn:aws:secretsmanager:us-west-2:537014313177:secret:storephront-database-postgres-user-access-QU2fSB", // required
      sql: "select * from phront.\"Collection\"", // required
      continueAfterTimeout: false,
      database: 'postgres',
      includeResultMetadata: true,
      schema: 'phront'
    };

    rdsdataservice.executeStatement(params, function(err, data) {
      if (err) {
          console.log(err, err.stack); // an error occurred
      }
      else {
      }    console.log(data);           // successful response
    });
*/

var createPrimaryKayColumnTemplate = ``;


var createTableTemplatePrefix = `CREATE TABLE :schema.":table"
    (
      id uuid NOT NULL DEFAULT phront.gen_random_uuid(),
      CONSTRAINT ":table_pkey" PRIMARY KEY (id)

      `,
      createTableColumnTextTemplate = `      :column :type COLLATE pg_catalog."default",`,
      createTableColumnTemplate = `      :column :type,`,


    createTableTemplateSuffix = `
    )
    WITH (
        OIDS = FALSE
    )
    TABLESPACE pg_default;

    ALTER TABLE :schema.":table"
        OWNER to :owner;
    `;





/**
* TODO: Document
*
* @class
* @extends RawDataService
*/
exports.PhrontService = PhrontService = RawDataService.specialize(/** @lends OfflineDataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function PhrontService() {
            RawDataService.call(this);
        }
    },

    databaseClusterAuthorization: {
      value: {
        resourceArn: "arn:aws:rds:us-west-2:537014313177:cluster:storephront-database", /* required */
        secretArn: "arn:aws:secretsmanager:us-west-2:537014313177:secret:storephront-database-postgres-user-access-QU2fSB" /* required */
      }
    },

    __databaseAuthorizationBySchema: {
      value: undefined
    },

    _databaseAuthorizationBySchema: {
      get: function() {
        if(!this.__databaseAuthorizationBySchema) {
          this.__databaseAuthorizationBySchema = new Map();
        }
        return this.__databaseAuthorizationBySchema;
      }
    },

    _databaseAuthorizationsForSchema: {
      value: function(schemaName) {
        var dbAuthorizations = this._databaseAuthorizationBySchema.get(schemaName);
        if(!dbAuthorizations) {
          this._databaseAuthorizationBySchema.set(schemaName, dbAuthorizations = new Map());
        }
        return dbAuthorizations;
      }
    },

    authorizationForDatabaseInSchema: {
      value: function(databaseName, schemaName) {
        var schemaDBAuthorizations = this._databaseAuthorizationsForSchema(schemaName);
        var dbAuthorization =  schemaDBAuthorizations.get(databaseName);

        if(!dbAuthorization) {
          var databaseClusterAuthorization = this.databaseClusterAuthorization;
          dbAuthorization = {};
          for(var key in databaseClusterAuthorization) {
            dbAuthorization[key] = databaseClusterAuthorization[key];
          }
          dbAuthorization.database = databaseName;
          dbAuthorization.schema = schemaName;
          schemaDBAuthorizations.set(databaseName,dbAuthorization);
        }
        return dbAuthorization;
      }
    },

    rawDataOperationForDatabaseSchema: {
      value: function(databaseName, schemaName) {
          var rawDataOperation = {},
          dbAuthorization = this.authorizationForDatabaseInSchema(databaseName, schemaName);

          for(var key in dbAuthorization) {
            rawDataOperation[key] = dbAuthorization[key];
          }
          
          return rawDataOperation;
      }
    },

    __rdsDataService: {
      value: undefined
    },

    _rdsDataService: {
      get: function() {
        if(!this.__rdsDataService) {
          this.__rdsDataService = new AWS.RDSDataService({
            apiVersion: '2018-08-01',
            endpoint:"https://rds-data.us-west-2.amazonaws.com",
            region: "us-west-2"
          });

        }
        return this.__rdsDataService;
      }
    },


    persistObjectDescriptors: {
        value: function(objectDescriptors) {
            return this;
        }
    },


    /**
     * Public method invoked by the framework during the conversion from
     * an operation to a raw operation.
     * Designed to be overriden by concrete RawDataServices to allow fine-graine control
     * when needed, beyond transformations offered by an _ObjectDescriptorDataMapping_ or
     * an _ExpressionDataMapping_
     *
     * @method
     * @argument {DataOperation} object - An object whose properties must be set or
     *                             modified to represent the raw data oepration.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    mapToRawOperation: {
      value: function(dataOperation) {
      }
    },

    _createPrimaryKeyColumnTemplate: {
      value: `id uuid NOT NULL DEFAULT :schema.gen_random_uuid()`
    },

    primaryKeyColumnDeclaration: {
      value: function() {

      }
    },
    mapPropertyDescriptorTypeToRawType: {
      value: function(propertyDescriptorType) {
        if(propertyDescriptorType === "string") {
          return "text";
        }
        //This needs moore informtion from a property descriptor regarding precision, sign, etc..
        else if(propertyDescriptorType === "number") {
          return "decimal";
        }
        else {
          console.error("mapPropertyDescriptorTypeToRawType: unable to map "+propertyDescriptorType+" to RawType");
          return "text";
        }
      }
    },

    /*
    CREATE TABLE phront."_Collection"
      (
          id uuid NOT NULL DEFAULT phront.gen_random_uuid(),
          title character varying COLLATE pg_catalog."default",
          description character varying COLLATE pg_catalog."default",
          "descriptionHtml" text COLLATE pg_catalog."default",
          "productsArray" uuid[],
          CONSTRAINT "Collection_pkey" PRIMARY KEY (id)
      )
      WITH (
          OIDS = FALSE
      )
      TABLESPACE pg_default;

      ALTER TABLE phront."_Collection"
          OWNER to postgres;
    */

    //We need a mapping to go from model(schema?)/ObjectDescriptor to schema/table
   mapToRawCreateObjectDescriptorOperation: {
    value: function(dataOperation) {
        var objectDescriptor = dataOperation.data,
        tableName = objectDescriptor.name,
        propertyDescriptors = objectDescriptor.propertyDescriptors,
        i, countI, iPropertyDescriptor,
        //Hard coded for now
        databaseName = "postgres",
        //Hard coded for now
        schemaName = "phront",
        rawDataOperation = this.rawDataOperationForDatabaseSchema(databaseName, schemaName),
        sql = "",
        columnSQL = ',\n',
        /*
                parameters: [
            {
                name: "id",
                value: {
                    "stringValue": 1
                }
            }
        ]
      */
        parameters = null,
        continueAfterTimeout = false,
        includeResultMetadata = true,
        columnName,
        propertyValueDescriptor,
        columnType,
        owner = "postgres",
        createTableTemplatePrefix = `CREATE TABLE ${schemaName}."${tableName}"
        (
          id uuid NOT NULL DEFAULT phront.gen_random_uuid(),
          CONSTRAINT "${tableName}_pkey" PRIMARY KEY (id)`,
      createTableTemplateSuffix = `
        )
        WITH (
            OIDS = FALSE
        )
        TABLESPACE pg_default;

        ALTER TABLE ${schemaName}."${tableName}"
            OWNER to ${owner};
        `;

        // parameters.push({
        //   name:"schema",
        //   value: {
        //     "stringValue": schemaName
        // }
        // });
        // parameters.push({
        //   name:"table",
        //   value: {
        //     "stringValue": tableName
        // }
        // });
        // parameters.push({
        //   name:"owner",
        //   value: {
        //     "stringValue": "postgres"
        // }
        // });



        for(i=0, countI = propertyDescriptors.length;(i<countI);i++) {
            iPropertyDescriptor = propertyDescriptors[i];
            columnName  = iPropertyDescriptor.name;
            if(propertyValueDescriptor = iPropertyDescriptor.valueDescriptor) {
              if(iPropertyDescriptor.cardinality === 1) {
                columnType = "uuid";
              }
              else {
                columnType = "uuid[]";
              }
              columnSQL+= columnName + " "+columnType;
            }
            else {
              columnType  = this.mapPropertyDescriptorTypeToRawType(iPropertyDescriptor.valueType);
              columnSQL+= columnName + " "+columnType;
              if(columnType === 'text') {
                columnSQL += ' COLLATE pg_catalog."default"';
              }
            }
            if(i<countI-1) {
              columnSQL += ',\n';
            }      

        }

        sql+=createTableTemplatePrefix;

        //If we added more to ",\n"
        if(columnSQL.length > 2) {
          sql+=columnSQL;
        }
        sql+=createTableTemplateSuffix;

        rawDataOperation.sql = sql;
        rawDataOperation.continueAfterTimeout = continueAfterTimeout;
        rawDataOperation.includeResultMetadata = includeResultMetadata;
        //rawDataOperation.parameters = parameters;
        
        return rawDataOperation;
    }
  },
  performCreateObjectDescriptorOperation: {
    value: function(dataOperation, callback) {
      return this._executeStatement(dataOperation, callback)
    }
  },

  handleCreateObjectDescriptorOperation: {
        value: function(dataOperation) {
          var rawDataOperation = this.mapToRawCreateObjectDescriptorOperation(dataOperation);
          console.log("rawDataOperation: ",rawDataOperation);
          this.performCreateObjectDescriptorOperation(rawDataOperation,function(err, data) {
            if (err) {
                console.log(err, err.stack, rawDataOperation); // an error occurred
            }
            else {
              console.log(data);           // successful response
            }    
          });
        }
    },

    handleCreateOperation: {
        value: function(dataOperation) {
            var data = dataOperation.data;

            if(data instanceof ObjectDescriptor) {
                return this.handleCreateObjectDescriptorOperation(dataOperation);
            }
            return this;
        }
    },

    // Export promisified versions of the RDSDataService methods
    batchExecuteStatement: {
      value: function(params) {
        this._rdsDataService.batchExecuteStatement(params, function(err, data) {
          if (err) {
              console.log(err, err.stack); // an error occurred
          }
          else {
          }    console.log(data);           // successful response
        });      
      }
    },
    beginTransaction: {
      value: function(params) {
        this._rdsDataService.beginTransaction(params, function(err, data) {
          if (err) {
              console.log(err, err.stack); // an error occurred
          }
          else {
          }    console.log(data);           // successful response
        });      
      }
    },
    commitTransaction: {
      value: function(params) {
        this._rdsDataService.commitTransaction(params, function(err, data) {
          if (err) {
              console.log(err, err.stack); // an error occurred
          }
          else {
          }    console.log(data);           // successful response
        });      
      }
  },
    _executeStatement: {
        value: function(params, callback) {
          this._rdsDataService.executeStatement(params, callback);      
        }
    },
    rollbackTransaction: {
      value: function(params) {
        this._rdsDataService.rollbackTransaction(params, function(err, data) {
          if (err) {
              console.log(err, err.stack); // an error occurred
          }
          else {
          }    console.log(data);           // successful response
        });      
      }    }

});
