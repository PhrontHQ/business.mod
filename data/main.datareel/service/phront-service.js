var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    Criteria = require("montage/core/criteria").Criteria,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    RawEmbeddedValueToObjectConverter = require("montage/data/converter/raw-embedded-value-to-object-converter").RawEmbeddedValueToObjectConverter,
    RawForeignValueToObjectConverter = require("montage/data/converter/raw-foreign-value-to-object-converter").RawForeignValueToObjectConverter,

    // DataQuery = require("montage/data/model/data-query").DataQuery,
    DataStream = require("montage/data/service/data-stream").DataStream,
    //Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    uuid = require("montage/core/uuid"),
    DataOrdering = require("montage/data/model/data-ordering").DataOrdering,
    //DESCENDING = DataOrdering.DESCENDING,
    //evaluate = require("montage/frb/evaluate"),
    Set = require("montage/collections/set"),

    //Not needed at all as not used
    // XMLHttpRequest = require("xhr2"),
    // querystring = require('querystring'),
    // Require sqlstring to add additional escaping capabilities
    //sqlString = require('sqlstring'),


    DataOperation = require("montage/data/service/data-operation").DataOperation,
    DataOperationType = require("montage/data/service/data-operation").DataOperationType,

    // Require the aws-sdk. This is a dev dependency, so if being used
    // outside of a Lambda execution environment, it must be manually installed.
    // Todo check the new version of the SDK coming at:
    //  https://github.com/aws/aws-sdk-js-v3/tree/master/clients/node/client-rds-data-node
    //  https://www.npmjs.com/package/@aws-sdk/client-rds-data-node

    //Benoit, these 2 are node.js specific, we need to see how to deal with that.
    AWS = require('aws-sdk'),
    https = require('https'),
    // //For browser
    // https = null,


    pgutils = require('./pg-utils'),
    prepareValue = pgutils.prepareValue,
    escapeIdentifier = pgutils.escapeIdentifier,
    escapeLiteral = pgutils.escapeLiteral,
    literal = pgutils.literal,
    escapeString = pgutils.escapeString,
    pgstringify = require('./pgstringify'),
    PhrontService;

class Timer {
    // Automatically starts the timer
    constructor(name = 'Benchmark') {
        this.NS_PER_SEC = 1e9;
        this.MS_PER_NS = 1e-6
        this.name = name;
        this.startTime = process.hrtime();
    }

    // returns the time in ms since instantiation
    // can be called multiple times
    runtimeMs() {
        const diff = process.hrtime(this.startTime);
        return (diff[0] * this.NS_PER_SEC + diff[1]) * this.MS_PER_NS;
    }

    // retuns a string: the time in ms since instantiation
    runtimeMsStr() {
        return `${this.name} took ${this.runtimeMs()} milliseconds`;
    }
}



//Node.js specific
if (https) {
    /**********************************************************************/
    /** Enable HTTP Keep-Alive per https://vimeo.com/287511222          **/
    /** This dramatically increases the speed of subsequent HTTP calls  **/
    /**********************************************************************/
    const sslAgent = new https.Agent({
        keepAlive: true,
        maxSockets: 50, // same as aws-sdk
        rejectUnauthorized: true  // same as aws-sdk
    });
    sslAgent.setMaxListeners(0); // same as aws-sdk
}

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
exports.PhrontService = PhrontService = RawDataService.specialize(/** @lends PhrontService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function PhrontService() {
            RawDataService.call(this);


            if(this._mapResponseHandlerByOperationType.size === 0) {
                this._mapResponseHandlerByOperationType.set(DataOperationType.create, this.mapHandledCreateResponseToOperation);
                this._mapResponseHandlerByOperationType.set(DataOperationType.read, this.mapHandledReadResponseToOperation);
                this._mapResponseHandlerByOperationType.set(DataOperationType.update, this.mapHandledUpdateResponseToOperation);
                this._mapResponseHandlerByOperationType.set(DataOperationType.delete, this.mapHandledDeleteResponseToOperation);
            }

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
        get: function () {
            if (!this.__databaseAuthorizationBySchema) {
                this.__databaseAuthorizationBySchema = new Map();
            }
            return this.__databaseAuthorizationBySchema;
        }
    },

    _databaseAuthorizationsForSchema: {
        value: function (schemaName) {
            var dbAuthorizations = this._databaseAuthorizationBySchema.get(schemaName);
            if (!dbAuthorizations) {
                this._databaseAuthorizationBySchema.set(schemaName, dbAuthorizations = new Map());
            }
            return dbAuthorizations;
        }
    },

    authorizationForDatabaseInSchema: {
        value: function (databaseName, schemaName) {
            var schemaDBAuthorizations = this._databaseAuthorizationsForSchema(schemaName);
            var dbAuthorization = schemaDBAuthorizations.get(databaseName);

            if (!dbAuthorization) {
                var databaseClusterAuthorization = this.databaseClusterAuthorization;
                dbAuthorization = {};
                for (var key in databaseClusterAuthorization) {
                    dbAuthorization[key] = databaseClusterAuthorization[key];
                }
                dbAuthorization.database = databaseName;
                dbAuthorization.schema = schemaName;
                schemaDBAuthorizations.set(databaseName, dbAuthorization);
            }
            return dbAuthorization;
        }
    },

    rawDataOperationForDatabaseSchema: {
        value: function (databaseName, schemaName) {
            var rawDataOperation = {},
                dbAuthorization = this.authorizationForDatabaseInSchema(databaseName, schemaName);

            for (var key in dbAuthorization) {
                rawDataOperation[key] = dbAuthorization[key];
            }

            return rawDataOperation;
        }
    },

    __rdsDataService: {
        value: undefined
    },

    _rdsDataService: {
        get: function () {
            if (!this.__rdsDataService) {
                this.__rdsDataService = new AWS.RDSDataService({
                    apiVersion: '2018-08-01',
                    endpoint: "https://rds-data.us-west-2.amazonaws.com",
                    region: "us-west-2"
                });

            }
            return this.__rdsDataService;
        }
    },
    /*
        _googleDataService: {
            value: undefined
        },

        googleDataService: {
            get: function() {
                if(!this._googleDataService) {
                    this._googleDataService = this.childServices.values().next().value;
                }
                return this._googleDataService;
            }
        },
    */
    fetchData: {
        value: function (query, stream) {
            var self = this,
                objectDescriptor = this.objectDescriptorForType(query.type),
                readOperation = new DataOperation();

            stream = stream || new DataStream();
            stream.query = query;

            //We need to turn this into a Read Operation. Difficulty is to turn the query's criteria into
            //one that doesn't rely on objects. What we need to do before handing an operation over to another context
            //bieng a worker on the client side or a worker on the server side, is to remove references to live objects.
            //One way to do this is to replace every object in a criteria's parameters by it's data identifier.
            //Another is to serialize the criteria.
            readOperation.type = DataOperation.Type.Read;
            readOperation.dataDescriptor = objectDescriptor.module.id;
            readOperation.criteria = query.criteria;
            readOperation.objectExpressions = query.prefetchExpressions;

            //Where do we put the "select part" ? The list of properties, default + specific ones asked by developer and
            //eventually collected by the framework through triggers?
            // - prefetchExpressions is a list like that on the query object.
            // - selectBindings s another.


            // return new Promise(function(resolve,reject) {

            self.handleRead(readOperation)
                .then(function (readUpdatedOperation) {
                    var records = readUpdatedOperation.data;

                    if (records && records.length > 0) {

                        //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
                        self.addRawData(stream, records, readOperation._rawReadExpressionIndexMap);
                    }

                    self.rawDataDone(stream);

                }, function (readFailedOperation) {
                    console.error(readFailedOperation);
                    self.rawDataDone(stream);

                });
            // });

            return stream;
        }
    },
    inlineCriteriaParameters: {
        value: true
    },
    /*
        as we move into being able to handle the traversal of relationships, we'll need to map that to joins,
        which means that mapping the criteria will have to introduce new tables, most likely with aliases, into the FROM section
        which is still handled outside of this, but it has to unified so we can dynamically add the tables/attributes we need to join

        we might need to rename the method, or create a larger scope one, such as:
        mapDataQueryToRawDataQuery

    */

    mapCriteriaToRawCriteria: {
        value: function (criteria, mapping) {
            var rawCriteria,
                rawExpression,
                rawParameters;

            if (!criteria) return undefined;

            if (criteria.parameters) {
                if (this.inlineCriteriaParameters) {
                    rawParameters = criteria.parameters;
                } else {
                    //If we could use parameters with the DataAPI (we can't because it doesn't support some types we need like uuid and uuid[]), we would need stringify to create a new set of parameters. Scope can be different objects, so instead of trying to clone whatever it is, it would be easier to modify stringify so it returns the whole new raw criteria that would contain both the expression and the new parameters bound for SQL.
                    // rawParameters = {};
                    // Object.assign(rawParameters,criteria.parameters);
                    throw new Error("phron-service.js: mapCriteriaToRawCriteria doesn't handle the use of parametrized SQL query with a dictionary of parameters. If we could use parameters with the DataAPI (we can't because it doesn't support some types we need like uuid and uuid[]), we would need stringify to create a new set of parameters. Scope can be different objects, so instead of trying to clone whatever it is, it would be easier to modify stringify so it returns the whole new raw criteria that would contain both the expression and the new parameters bound for SQL. -> " + JSON.stringify(criteria) + "objectDescriptor: " + mapping.objectDescriptor.name);

                }

            }

            rawExpression = this.stringify(criteria.syntax, rawParameters, [mapping]);
            rawCriteria = new Criteria().initWithExpression(rawExpression, this.inlineCriteriaParameters ? null : rawParameters);
            return rawCriteria;
        }

    },
    /*
        mapCriteriaToRawStatement: {
          value: function(criteria, mapping) {
            var objectRule,
                rule,
                syntax = criteria ? criteria.syntax : null,
                property,
                propertyName,
                propertyDescriptor,
                rawProperty,
                escapedRawProperty,
                value,
                escapedValue,
                pgstringifiedValue,
              condition;


            //   if(criteria) {
            //     pgstringifiedValue = this.stringify(criteria.syntax,criteria.parameters,mapping);
            //     console.log(pgstringifiedValue);
            //   }

            //Going to be ugly...
              //We need to transform the criteria into a SQL equivalent. Hard-coded for a single object for now

              //Hard coded Find an object with it's originId:
              if(criteria && criteria.parameters && Object.keys(criteria.parameters).length === 1 && criteria.parameters.hasOwnProperty("originId")) {
                condition = `"originId" = '${criteria.parameters.originId}'`;
              }
              else if(syntax && syntax.type == "equals") {
                var args = syntax.args;

                //There are 2 arguments, one is a property name, and the other the parameter.
                //Let's look for the parameter.
                //The first 2 look for a parsed expression  like "id = $id"
                if(args[1].type === "property" && args[1].args[0].type === "parameters") {
                    value = criteria.parameters[args[1].args[1].value];
                    propertyName = args[0].args[1].value;
                }
                else if(args[0].type === "property" && args[0].args[0].type === "parameters") {
                    value = criteria.parameters[args[0].args[1].value];
                    propertyName = args[1].args[1].value;
                }
                //This one looks for parsed expression like "id = $""
                else if(args[1].type === "parameters") {
                    propertyName = args[0].args[1].value;
                    value = criteria.parameters;
                }

                objectRule = mapping.objectMappingRules.get(propertyName);
                if(objectRule) {
                  propertyDescriptor = objectRule.propertyDescriptor;
                }
                rule = objectRule && mapping.rawDataMappingRules.get(objectRule.sourcePath);

                if(rule) {
                  rawProperty = objectRule.sourcePath;
                  escapedRawProperty = escapeIdentifier(rawProperty);
                }
                else {
                  escapedRawProperty = escapeIdentifier(propertyName);
                }

                escapedValue = this.mapPropertyValueToRawTypeExpression(rawProperty,value);

                // if(args[0].type === "property") {
                //   propertyName = args[0].args[1].value;
                //   objectRule = mapping.objectMappingRules.get(propertyName);
                //   if(objectRule) {
                //     propertyDescriptor = objectRule.propertyDescriptor;
                //   }
                //   rule = objectRule && mapping.rawDataMappingRules.get(objectRule.sourcePath);

                //   if(rule) {
                //     rawProperty = objectRule.sourcePath;
                //     escapedRawProperty = escapeIdentifier(rawProperty);
                //   }
                //   else {
                //     escapedRawProperty = escapeIdentifier(propertyName);
                //   }
                // }
                // if(args[1].type === "parameters") {
                //   value = criteria.parameters;
                //   escapedValue = this.mapPropertyValueToRawTypeExpression(rawProperty,value);
                // }

                if(propertyDescriptor && propertyDescriptor.valueType == "string") {
                    condition = `${escapedRawProperty} ilike ${escapedValue}`
                }
                else {
                    condition = `${escapedRawProperty} = ${escapedValue}`
                }

              }
              else if(syntax && syntax.type == "has") {
                var args = syntax.args;
                // if(args[1].type === "property") {
                //     propertyName = args[1].args[1].value;

                //     if(args[0].type === "parameters") {
                //         value = criteria.parameters;
                //         escapedValue = this.mapPropertyValueToRawTypeExpression(rawProperty,value,"list");
                //     }
                // }
                // else
                if(args[0].type === "parameters") {
                    if(args[1].type === "property") {
                        propertyName = args[1].args[1].value;
                    }
                    else {
                        throw new Error("phront-service.js: unhandled syntax in mapCriteriaToRawStatement(criteria: "+JSON.stringify(criteria)+"objectDescriptor: "+mapping.objectDescriptor.name);
                    }
                    value = criteria.parameters;
                    rawProperty = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                    escapedValue = this.mapPropertyValueToRawTypeExpression(rawProperty,value,"list");

                } else if(args[0].type === "property") {
                    propertyName = args[0].args[1].value;

                    if(args[0].type === "parameters") {
                        value = criteria.parameters;
                        rawProperty = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                        escapedValue = this.mapPropertyValueToRawTypeExpression(rawProperty,value,"list");
                    }
                    else if(args[1].type === "parameters") {
                        value = criteria.parameters;
                        if(!Array.isArray(value)) {
                            value = [value];
                        }
                        rawProperty = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                        escapedValue = this.mapPropertyValueToRawTypeExpression(rawProperty,value);
                    } else if(args[1].type === "property" && args[1].args[0].type === "parameters") {
                        var parametersKey = args[1].args[1].value;
                        value = criteria.parameters[parametersKey];
                        if(!Array.isArray(value)) {
                            value = [value];
                        }
                        rawProperty = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                        escapedValue = this.mapPropertyValueToRawTypeExpression(rawProperty,value);
                    }

                } else {
                    throw new Error("phron-service.js: unhandled syntax in mapCriteriaToRawStatement(criteria: "+JSON.stringify(criteria)+"objectDescriptor: "+mapping.objectDescriptor.name);
                }
                // rawProperty = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                escapedRawProperty = escapeIdentifier(rawProperty);

                if(rawProperty === "id")  {
                    condition = `${escapedRawProperty} in ${escapedValue}`
                } else {
                    condition = `${escapedRawProperty} @> ${escapedValue}`
                }


              }
              else if((criteria && criteria.expression) || (criteria && criteria.syntax) || (criteria && criteria.parameters)) {
                console.error("missing implementation of criteria ",criteria);
              }
              return condition;
          }
        },
    */
    HAS_DATA_API_UUID_ARRAY_BUG: {
        value: false
    },

    mapReadOperationToRawStatement: {
        value: function (readOperation, rawDataOperation) {
            //Now we need to transf orm the operation into SQL:
            var objectDescriptor = this.objectDescriptorWithModuleId(readOperation.dataDescriptor),
                mapping = this.mappingWithType(objectDescriptor),
                objectExpressions = readOperation.objectExpressions,
                rawDataPrimaryKeys = mapping.rawDataPrimaryKeys,
                operationName = readOperation.name,
                //We start by the mandatory, but the read operation could have
                //further information about what to retur, including new constructs based on expressions.
                rawReadExpressions,//Set
                tableName = this.tableForObjectDescriptor(objectDescriptor),
                criteria = readOperation.criteria,
                schemaName = rawDataOperation.schema,
                /*
                  If Read Expressions is a structure like montage serialization values and used for DataQuery's
                  selectBindings:

                  aDataQuery.selectBindings = {
                      "averageAge": {"<-": "data.map{age}.average()"
                  };

                  The left side, "averageAge" would be the "As" in the select statement like in:

                    SELECT kind, sum(len) AS total FROM films GROUP BY kind;

                  would be expressed like:

                    "total": {"<-": "sum(len)"}

                  The rigth part might need to leverage functions or a whole new sub select?

                */
                readExpressions = readOperation.readExpressions,
                i, countI, iKey, iValue, iAssignment, iPrimaryKey, iPrimaryKeyValue,
                iKeyValue,
                rawCriteria,
                condition,
                rawReadExpressionsArray,
                anExpression,
                //rawReadExpressionMap = new Map,
                anEscapedExpression,
                escapedRawReadExpressionsArray,
                rawReadExpressionsIterator,
                sql,
                self = this,
                HAS_DATA_API_UUID_ARRAY_BUG = this.HAS_DATA_API_UUID_ARRAY_BUG;


            //WARNING If a set of objectExpressions is expressed on the operation for now it will excludes
            //the requisites.
            if (objectExpressions) {
                rawReadExpressions = new Set(objectExpressions.map(expression => mapping.mapObjectPropertyNameToRawPropertyName(expression)));
            } else {
                rawReadExpressions = new Set(mapping.rawRequisitePropertyNames)
            }

            //Adds the primaryKeys to the columns fetched
            rawDataPrimaryKeys.forEach(item => rawReadExpressions.add(item));

            //Make it an Array
            // rawReadExpressionsArray = Array.from(rawReadExpressions);
            rawReadExpressionsArray = [];
            escapedRawReadExpressionsArray = [];
            rawReadExpressionsIterator = rawReadExpressions.values();
            i = 0;
            while ((anExpression = rawReadExpressionsIterator.next().value)) {
                rawReadExpressionsArray.push(anExpression);
                //rawReadExpressionMap.set(anExpression,i);

                if (HAS_DATA_API_UUID_ARRAY_BUG) {
                    /*
                      We need to wrap any toMany holding uuids in an array like this:
                      CAST (\"addressIds\" AS text[])
                    */
                    var rule = mapping.rawDataMappingRules.get(anExpression),
                        propertyName = rule ? rule.sourcePath : anExpression,
                        propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName);
                    //id / primary keys don't have property descriptors
                    if (propertyDescriptor && propertyDescriptor.valueDescriptor && propertyDescriptor.cardinality > 1) {
                        anEscapedExpression = `CAST (${escapeIdentifier(anExpression)} AS text[])`;
                    }
                    else {
                        anEscapedExpression = escapeIdentifier(anExpression);
                    }
                }
                else {
                    anEscapedExpression = escapeIdentifier(anExpression);
                }
                escapedRawReadExpressionsArray.push(`"${tableName}".${anEscapedExpression}`);

                i++;
            }





            /*
            SELECT f.title, f.did, d.name, f.date_prod, f.kind
                FROM distributors d, films f
                WHERE f.did = d.did
            */

            rawCriteria = this.mapCriteriaToRawCriteria(criteria, mapping);
            condition = rawCriteria ? rawCriteria.expression : undefined;
            //     console.log(" new condition: ",condition);
            //condition = this.mapCriteriaToRawStatement(criteria, mapping);
            // console.log(" old condition: ",condition);

            sql = `SELECT (SELECT row_to_json(_) FROM (SELECT ${escapedRawReadExpressionsArray.join(",")}) as _) FROM ${schemaName}."${tableName}"`;
            if (condition) {
                //Let's try if it doestn't start by a JOIN before going for not containing one at all
                if(condition.indexOf("JOIN") !== 0) {
                    sql += ` WHERE (${condition})`;
                } else {
                    sql += ` ${condition}`;
                }
            }
            //sql = `SELECT ${escapedRawReadExpressionsArray.join(",")} FROM ${schemaName}."${tableName}" WHERE (${condition})`;

            rawDataOperation.sql = sql;
            if (rawCriteria && rawCriteria.parameters) {
                rawDataOperation.parameters = rawCriteria.parameters;
            }

            //return rawReadExpressionMap;
        }
    },

    _handleReadCount: {
        value: 0
    },

    handleRead: {
        value: function (readOperation) {
            var data = readOperation.data,
                rawReadExpressionMap;

            //console.log("PhrontService: handleRead readOperation.id: ",readOperation.id)
            //No implementation/formalization yet to read the schema and retrieve ObjectDescriptors
            //Built from an existing schema. How would we express that in a read criteria? What would be the
            //objectDescriptor property? The model? Does naming that property that way actually work?
            // if(data instanceof ObjectDescriptor) {
            //   return this.handleReadObjectDescriptorOperation(readOperation);
            // } else {
            var rawDataOperation = {},
                objectDescriptor = this.objectDescriptorWithModuleId(readOperation.dataDescriptor),
                dataChanges = data,
                changesIterator,
                aProperty, aValue, addedValues, removedValues, aPropertyDescriptor,
                self = this;

            //This adds the right access key, db name. etc... to the RawOperation.
            this.mapObjectDescriptorToRawOperation(objectDescriptor, rawDataOperation);
            this.mapReadOperationToRawStatement(readOperation, rawDataOperation);

            //return new Promise(function(resolve,reject) {
            //var timeID = self._handleReadCount++,
            //start = Date.now();
            // startTime = console.time(readOperation.id);
            //var timer = new Timer(readOperation.id);

            // if(rawDataOperation.sql.indexOf('"name" = ') !== -1 && rawDataOperation.sql.indexOf("Organization") !== -1) {
            //   console.log(rawDataOperation.sql);
            // }
            //console.log("executeStatement "+rawDataOperation.sql);

            self._executeStatement(rawDataOperation, function (err, data) {
                //var endTime  = console.timeEnd(readOperation.id);
                //console.log(timer.runtimeMsStr() + " for sql: "+rawDataOperation.sql);

                //console.log("Query took "+(Date.now()-start)+ " ms");
                //debug
                //   if(rawDataOperation.sql.indexOf('"name" ilike ') !== -1 && rawDataOperation.sql.indexOf("Organization") !== -1 && data.records.length === 0) {
                //     console.log(rawDataOperation.sql);
                //   }
                //   else if(rawDataOperation.sql.indexOf('"name" ilike ') !== -1 && rawDataOperation.sql.indexOf("Organization") !== -1 && data.records.length > 0){
                //       console.log("organization found by name");
                //   }
                var operation = self.mapHandledReadResponseToOperation(readOperation, err, data/*, record*/);
                objectDescriptor.dispatchEvent(operation);
            });

            //});
            //}
        }
    },

    mapHandledReadResponseToOperation: {
        value: function(readOperation, err, data, records) {
            var operation = new DataOperation();

            operation.referrerId = readOperation.id;
            operation.dataDescriptor = readOperation.dataDescriptor;

            //Carry on the details needed by the coordinator to dispatch back to client
            // operation.connection = readOperation.connection;
            operation.clientId = readOperation.clientId;
            //console.log("executed Statement err:",err, "data:",data);

            if (err) {
                // an error occurred
                //console.log("!!! handleRead FAILED:", err, err.stack, rawDataOperation.sql);
                operation.type = DataOperation.Type.ReadFailed;
                //Should the data be the error?
                operation.data = err;
            }
            else {
                // successful response
                operation.type = DataOperation.Type.ReadCompleted;
                //We provide the inserted record as the operation's payload
                operation.data = data.records;
            }
            return operation;
        }
    },


    /*
        handleEventRead: {
            value: function(readOperation) {
                var operation = new DataOperation(),
                objectDescriptor = this.objectDescriptorWithModuleId(readOperation.dataDescriptor);
                ;

                operation.referrerId = readOperation.id;
                operation.dataDescriptor = readOperation.dataDescriptor;

                //Carry on the details needed by the coordinator to dispatch back to client
                // operation.connection = readOperation.connection;
                operation.clientId = readOperation.clientId;

                return this.googleDataService.handleEventRead(readOperation).
                then(function(rawEvents) {
                    operation.type = DataOperation.Type.ReadCompleted;
                    //We provide the inserted record as the operation's payload
                    operation.data = rawEvents;

                    //Not needed anymore as we request data as json
                    //operation._rawReadExpressionIndexMap = rawReadExpressionMap;
                    objectDescriptor.dispatchEvent(operation);
                },function(error) {
                    operation.type = DataOperation.Type.ReadFailed;
                    //Should the data be the error?
                    operation.data = err;
                    objectDescriptor.dispatchEvent(operation);

                });

                return this.handleRead(readOperation);
            }
        },
    */

    /*
      overriden to efficently counters the data structure
      returned by AWS RDS DataAPI efficently
    */
    addOneRawData: {
        value: function (stream, rawData, context) {
            return this.super(stream, JSON.parse(rawData[0].stringValue), context);
        }
    },


    saveDataObject: {
        value: function (object) {
            var self = this,
                operation = new DataOperation(),
                dataIdentifier = this.dataIdentifierForObject(object),
                objectDescriptor = this.objectDescriptorForObject(object),
                snapshot = this.snapshotForDataIdentifier(object.dataIdentifier),
                dataObjectChanges,
                changesIterator,
                aProperty,
                operationData = {},
                mappingPromises,
                mapping,
                i, countI;

            operation.dataDescriptor = objectDescriptor.module.id;

            //When we have an operation to deal with, we'll know which it is.
            //Here we don't know if this record is a newly created object or one we fetched.

            //We have a known dataIdentifier for this object, it's an Update Operation:
            if (dataIdentifier) {
                operation.type = DataOperation.Type.Update;
                mapping = this.mappingWithType(objectDescriptor);

                //TEMPORARY, we need to send what changed only
                operation.criteria = Criteria.withExpression("identifier = $identifier", { "identifier": dataIdentifier });
                operation.data = operationData;

                dataObjectChanges = this.changesForDataObject(object);

                if (!dataObjectChanges) {
                    //No changes to save for that object, we cancel.
                    var createCancelledOperation = new DataOperation();
                    createCancelledOperation.referrerId = operation.id;
                    createCancelledOperation.type = DataOperation.Type.CreateCancelled;

                    //What else should we put on a CreateCancelled opration? A reason?

                    return Promise.resolve(createCancelledOperation);
                }

                //Now that we got them, clear it so we don't conflict with further changes
                //if we have some async mapping stuff in-between
                this.clearRegisteredChangesForDataObject(object);

                changesIterator = dataObjectChanges.keys();
                while ((aProperty = changesIterator.next().value)) {
                    aValueChanges = dataObjectChanges.get(aProperty);
                    aPropertyDescriptor = objectDescriptor.propertyDescriptorForName(aProperty);

                    // if(aPropertyDescriptor.valueDescriptor) {
                    //     console.log("It's an object, identifier is: ",this.dataIdentifierForObject(aValue));
                    // }

                    //A collection with "addedValues" / "removedValues" keys
                    if (aValueChanges.hasOwnProperty("addedValues") || aValueChanges.hasOwnProperty("removedValues")) {
                        if (!(aPropertyDescriptor.cardinality > 1)) {
                            throw new Error("added/removed values for property without a to-many cardinality");
                        }
                        //Until we get more sophisticated / use an expression mapping, we're
                        //going to turn objects into their identifer
                        addedValues = aValueChanges.addedValues;
                        for (i = 0, countI = addedValues.length; i < countI; i++) {
                            addedValues[i] = this.dataIdentifierForObject(addedValues[i]);
                        }
                        removedValues = aValueChanges.removedValues;
                        for (i = 0, countI = removedValues.length; i < countI; i++) {
                            removedValues[i] = this.dataIdentifierForObject(removedValues[i]);
                        }
                        //Here we mutated the structure from changesForDataObject. I should be cleared
                        //when saved, but what if save fails and changes happen in-between?

                        //1/10/2020: was operation which was putting
                        //aProperty -> aValueChanges in the wrong place
                        operationData[mapping.mapObjectPropertyNameToRawPropertyName(aProperty)] = aValueChanges;
                    }
                    else {
                        //Here, we don't really use the store value of a regular property's change
                        //It should be exactly the same as the value on the object. Should we really
                        //use memory to keep a pointer on it?
                        result = this._mapObjectPropertyToRawData(object, aProperty, operationData);
                        if (this._isAsync(result)) {
                            mappingPromises = mappingPromises || [];
                            mappingPromises.push(result);
                        }
                    }
                }

                if (Object.keys(operationData).length === 0 && !mappingPromises || mappingPromises.length === 0) {
                    //console.log("NOTHING CHANGED TO SAVE");
                    var saveCanceledOperation = new DataOperation();
                    operation.type = DataOperation.Type.UpdateCanceled;
                    operation.reason = "No Changes to save";
                    return Promise.resolve(operation);
                }

                return (mappingPromises
                    ? Promise.all(mappingPromises)
                    : Promise.resolve(true))
                    .then(function (success) {
                        //All mapping done and stored in operation.
                        return new Promise(function (resolve, reject) {

                            self.handleUpdate(operation)
                                .then(function (rawUpdateCompletedOperation) {
                                    var updateCompletedOperation = new DataOperation();
                                    updateCompletedOperation.type = DataOperation.Type.UpdateCompleted;
                                    updateCompletedOperation.data = object;
                                    updateCompletedOperation.dataDescriptor = objectDescriptor.module.id;
                                    resolve(updateCompletedOperation);
                                }, function (rawUpdateFailedOperation) {
                                    var updateFailedOperation = new DataOperation();
                                    updateFailedOperation.type = DataOperation.Type.UpdateFailed;
                                    updateFailedOperation.data = object;
                                    updateFailedOperation.dataDescriptor = objectDescriptor.module.id;

                                    reject(updateFailedOperation);
                                });
                        });
                    }, function (mappingError) {
                        console.error(mappingError);
                    });

            } else {
                operation.type = DataOperation.Type.Create;
                operation.data = object;

                return new Promise(function (resolve, reject) {

                    //THIS NEEDS TO RETURN SOMETHING SUCCEED/FAIL
                    //AND Regiter the new dataIdentifierForObject(object) so that from now-on. this.dataIdentifierForObject(object) returns it
                    self.handleCreate(operation)
                        .then(function (createCompletedRawOperation) {
                            //Record dataIdentifier for object
                            var createCompletedOperation = new DataOperation(),
                                rawData = createCompletedRawOperation.data,
                                objectDescriptor = self.objectDescriptorWithModuleId(createCompletedRawOperation.dataDescriptor),
                                dataIdentifier = self.dataIdentifierForTypeRawData(objectDescriptor, rawData);

                            self.recordSnapshot(dataIdentifier, rawData);
                            self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);

                            //   var objectIdentifer =  self.dataIdentifierForObject(object);
                            //   console.log("objectIdentifer: ",objectIdentifer," for newly inserted object: ",object);
                            createCompletedOperation.referrerId = operation.id;

                            createCompletedOperation.type = DataOperation.Type.CreateCompleted;
                            createCompletedOperation.data = object;
                            resolve(createCompletedOperation);

                        }, function (createFailedRawOperation) {
                            //TODO needs a more dedicated type of error
                            var createFailedOperation = new DataOperation();
                            createFailedOperation.referrerId = operation.id;
                            createFailedOperation.type = DataOperation.Type.CreateFailed;
                            createFailedOperation.data = object;
                            reject(createFailedOperation);
                        });
                });

            }
            return this.nullPromise;

            //Temporary ripped from DataService implementation:
            // var self = this,
            //     mappingPromise,
            //     record = {};
            // mappingPromise =  this._mapObjectToRawData(object, record);
            // if (!mappingPromise) {
            //     mappingPromise = this.nullPromise;
            // }
            // return mappingPromise.then(function () {
            //         return self.saveRawData(record, object)
            //             .then(function (data) {
            //                 self.rootService.createdDataObjects.delete(object);
            //                 return data;
            //             });
            //  });


        }
    },

    /**
     * Subclasses should override this method to save a data object when that
     * object's raw data would be useful to perform the save.
     *
     * @method
     * @argument {Object} record   - An object whose properties hold the raw
     *                               data of the object to save.
     * @argument {?} context       - An arbitrary value sent by
     *                               [saveDataObject()]{@link RawDataService#saveDataObject}.
     *                               By default this is the object to save.
     * @returns {external:Promise} - A promise fulfilled when the object's data
     * has been saved. The promise's fulfillment value is not significant and
     * will usually be `null`.
     */

    //In the near future we should be dealing with a DataOperation, which we would then convert
    //to a RawDataOperation that can be sent to the database for execution.
    saveRawData: {
        value: function (record, object) {
            var rawDataOperation = {},
                objectDescriptor = this.objectDescriptorForObject(object);

            this.mapObjectDescriptorToRawOperation(objectDescriptor, rawDataOperation);

            //When we have an operation to deal with, we'll know which it is.
            //Here we don't know if this record is a newly created object or one we fetched
            if (this.dataIdentifierForObject(object)) {
                //Update Operation

                //Call
                phrontService.handleUpdate(iOperation);

            } else {
                //Temporarary: Create a Raw Data operation that we should receive later.
                // var operation = new DataOperation();
                // operation.type = DataOperation.Type.Create;
                // operation.data = object

                //
                phrontService.handleCreate(iOperation);

            }
            return this.nullPromise;
        }
    },



    persistObjectDescriptors: {
        value: function (objectDescriptors) {
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
        value: function (dataOperation) {
        }
    },

    _createPrimaryKeyColumnTemplate: {
        value: `id uuid NOT NULL DEFAULT :schema.gen_random_uuid()`
    },

    primaryKeyColumnDeclaration: {
        value: function () {

        }
    },

    mapObjectDescriptorRawPropertyToRawType: {
        value: function (objectDescriptor, rawProperty, _mapping, _propertyDescriptor, _rawDataMappingRule) {
            var mapping = _mapping || (objectDescriptor && this.mappingWithType(objectDescriptor)),
                propertyDescriptor = _propertyDescriptor,
                mappingRule,
                propertyName;

            if(mapping.rawDataPrimaryKeys.includes(rawProperty)) {
                return "uuid";
            } else {
                if(!propertyDescriptor) {
                    mappingRule = mapping.rawDataMappingRules.get(rawProperty);
                    propertyName = mappingRule ? mappingRule .sourcePath : rawProperty;
                    propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName);
                }
                return this.mapPropertyDescriptorToRawType(propertyDescriptor, mappingRule);
            }
        }
    },
    /*
    Mapping dates:
    https://www.postgresql.org/docs/9.5/datatype-datetime.html
    https://www.postgresql.org/docs/9.5/functions-datetime.html

    The Date.prototype.getTime() method returns the number of milliseconds* since the Unix Epoch.

    * JavaScript uses milliseconds as the unit of measurement, whereas Unix Time is in seconds.


    Use the to_timestamp() postgres function:

    `insert into times (time) values (to_timestamp(${Date.now()} / 1000.0))`
    shareimprove this answer
    edited Mar 19 '17 at 11:06
    answered Mar 19 '17 at 9:12

    Udi
    19.7k55 gold badges7272 silver badges100100 bronze badges
    4
    By way of explanation for this answer, JavaScript Date.now() returns the number of milliseconds since the Unix Epoch (1 Jan 1970). PostgreSQL to_timestamp(…) converts a single argument, interpreted as the number of seconds since the Unix Epoch into a PosgtreSQL timestamp. At some point, the JavaScript value needs to be divided by 1000. You could also write to_timestamp(${Date.now()/1000}). – Manngo Mar 19 '17 at 9:36
    Thanks didn't knew that PostgreSQL uses seconds instead of milliseconds, so sadly there will be a data loss... – Alexey Petrushin Mar 19 '17 at 10:49
    1
    To keep milliseconds, use / 1000.0 instead. I have fixed my answer above. – Udi Mar 19 '17 at 11:07
    2
    Why is the ${ } syntax needed? – Edward Oct 4 '17 at 17:50
    It is string injection. You can write 'INSERT INTO times (time) VALUES (to_timestamp(' + Date.now() /1000.0 + '))' too. @Edward – Capan Oct 8 at 15:25

    */

    mapPropertyDescriptorToRawType: {
        value: function (propertyDescriptor, rawDataMappingRule) {
            var propertyDescriptorType = propertyDescriptor.valueType,
                reverter = rawDataMappingRule.reverter,
                //For backward compatibility, propertyDescriptor.valueDescriptor still returns a Promise....
                //propertyValueDescriptor = propertyDescriptor.valueDescriptor;
                //So until we fix this, tap into the private instance variable that contains what we want:
                propertyValueDescriptor = propertyDescriptor._valueDescriptorReference;

            if (propertyValueDescriptor) {
                if (propertyValueDescriptor.name === "Range") {
                    return "tstzrange";
                } else if (reverter instanceof RawEmbeddedValueToObjectConverter) {
                    return "jsonb";
                } else if (propertyDescriptor.cardinality === 1) {
                    return "uuid";
                }
                else {
                    return "uuid[]";
                }
            }
            else {
                if (propertyDescriptor.cardinality === 1) {
                    return this.mapPropertyDescriptorTypeToRawType(propertyDescriptorType, propertyValueDescriptor);
                } else {
                    //We have a cardinality of n. The propertyDescriptor.collectionValueType should tell us if it's a list or a map
                    //But if we don't have a propertyValueDescriptor and propertyDescriptorType is an array, we don't know what
                    //kind of type would be in the array...
                    //We also don't know wether these objects should be stored inlined as JSONB for example. A valueDescriptor just
                    //tells what structured object is expected as value in JS, not how it is stored. That is a SQL Mapping's job.
                    //How much of expression data mapping could be leveraged for that?

                    //If it's to-many and objets, we go for jsonb
                    if (propertyDescriptorType === "object") {
                        return "jsonb";
                    }
                    else return this.mapPropertyDescriptorTypeToRawType(propertyDescriptorType, propertyValueDescriptor) + "[]";
                }

            }
        }
    },


    mapSearchablePropertyDescriptorToRawIndex: {
        value: function (propertyDescriptor, rawDataMappingRule) {
            var objectDescriptor = propertyDescriptor.owner,
                tableName = this.tableForObjectDescriptor(objectDescriptor),
                rawPropertyName = rawDataMappingRule ? rawDataMappingRule.targetPath : propertyDescriptor.name,
                indexType,
                propertyDescriptorType = propertyDescriptor.valueType,
                reverter = rawDataMappingRule.reverter,
                //For backward compatibility, propertyDescriptor.valueDescriptor still returns a Promise....
                //propertyValueDescriptor = propertyDescriptor.valueDescriptor;
                //So until we fix this, tap into the private instance variable that contains what we want:
                propertyValueDescriptor = propertyDescriptor._valueDescriptorReference;

            if (propertyValueDescriptor) {
                if (propertyValueDescriptor.name === "Range") {
                    indexType = "GIST";
                } else if (reverter instanceof RawEmbeddedValueToObjectConverter) {
                    indexType = "GIN";
                } else if (propertyDescriptor.cardinality === 1) {
                    indexType = "HASH";
                }
                else {
                    indexType = "GIN";
                }
            }
            //If propertyValueDescriptor isn't a relationship then we only index of specifically
            //asked for it.
            else if (propertyDescriptor.isSearchable) {
                if (propertyDescriptor.cardinality === 1) {
                    indexType = "BTREE";
                } else {
                    //for jsonb or arrays
                    indexType = "GIN";
                }
            }

            if(indexType) {
                return `CREATE INDEX "${tableName}_${rawPropertyName}_idx" ON "${tableName}" USING ${indexType} ("${rawPropertyName}");`;
            }
            return null;
        }
    },

    /*

       "timeRange": {
          "prototype": "montage/core/meta/property-descriptor",
          "values": {
              "name": "timeRange",
              "valueType": "date",
              "collectionValueType": "range",
              "valueDescriptor": {"@": "range"}
          }
      },

      needs to be saved as TSTZRANGE

    */

    mapPropertyDescriptorTypeToRawType: {
        value: function (propertyDescriptorType, propertyValueDescriptor) {
            if (propertyDescriptorType === "string" || propertyDescriptorType === "URL") {
                return "text";
            }
            //This needs moore informtion from a property descriptor regarding precision, sign, etc..
            else if (propertyDescriptorType === "number") {
                return "decimal";
            }
            else if (propertyDescriptorType === "boolean") {
                return "boolean";
            }
            else if (propertyDescriptorType === "date") {
                return "timestamp with time zone";//Defaults to UTC which is what we want
            }
            else if (propertyDescriptorType === "array" || propertyDescriptorType === "list") {
                //FIXME THIS IS WRONG and needs to be TENPORARY
                return "text[]";
            }
            else if (propertyDescriptorType === "object") {
                // if() {

                // } else {
                return "jsonb";
                //}
            }
            else {
                console.error("mapPropertyDescriptorTypeToRawType: unable to map " + propertyDescriptorType + " to RawType");
                return "text";
            }
        }
    },

    mapPropertyValueToRawType: {
        value: function (property, value, type) {
            if (value == null || value == "") {
                return "NULL";
            }
            else if (typeof value === "string") {
                return escapeString(value);
            }
            else {
                return prepareValue(value, type);
            }
        }
    },
    mapPropertyValueToRawTypeExpression: {
        value: function (property, value, type) {
            var mappedValue = this.mapPropertyValueToRawType(property, value, type);
            // if(mappedValue !== "NULL" && (Array.isArray(value) || typeof value === "string")) {
            //   return `'${mappedValue}'`;
            // }
            return mappedValue;
        }
    },
    mapPropertyDescriptorValueToRawValue: {
        value: function (propertyDescriptor, value, type) {
            if (value == null || value == "") {
                return "NULL";
            }
            else if (typeof value === "string") {
                return escapeString(value);
            }
            else {
                return prepareValue(value, type);
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



    /**
     * Called by a mapping before doing it's mapping work, giving the data service.
     * an opportunity to intervene.
     *
     * Subclasses should override this method to influence how are properties of
     * the raw mapped data to data objects:
     *
     * @method
     * @argument {Object} mapping - A DataMapping object handing the mapping.
     * @argument {Object} rawData - An object whose properties' values hold
     *                             the raw data.
     * @argument {Object} object - An object whose properties must be set or
     *                             modified to represent the raw data.
     * @argument {?} context     - The value that was passed in to the
     *                             [addRawData()]{@link RawDataService#addRawData}
     *                             call that invoked this method.
     */
    willMapRawDataToObject: {
        value: function (mapping, rawData, object, context) {
            //Amazon RDS Data API returns records as an array of each result for
            //a property in an index matching the order used in the select.
            //rawReadExpressionIndexMap contains the map from propertyName to that index
            //when it was constructed. We need to leverage this to make it look like
            //it's a usual key/value record.
            var rawReadExpressionIndexMap = context;
            //
            return rawData;
        }
    },

    //We need a mapping to go from model(schema?)/ObjectDescriptor to schema/table
    databaseForObjectDescriptor: {
        value: function (objectDescriptor) {
            //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
            return "postgres";
        }
    },

    schemaForObjectDescriptor: {
        value: function (objectDescriptor) {
            //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
            return "phront";
        }
    },

    tableForObjectDescriptor: {
        value: function (objectDescriptor) {
            //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
            return objectDescriptor.name;
        }
    },

    //We need a mapping to go from model(schema?)/ObjectDescriptor to schema/table
    mapObjectDescriptorToRawOperation: {
        value: function (objectDescriptor, rawDataOperation) {
            //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
            var databaseName = this.databaseForObjectDescriptor(objectDescriptor),
                //Hard coded for now, should be derived from a mapping telling us n which schemaName that objectDescriptor is stored
                schemaName = this.schemaForObjectDescriptor(objectDescriptor),

                dbAuthorization = this.authorizationForDatabaseInSchema(databaseName, schemaName);

            for (var key in dbAuthorization) {
                rawDataOperation[key] = dbAuthorization[key];
            }

            return rawDataOperation;
        }
    },

    //We need a mapping to go from model(schema?)/ObjectDescriptor to schema/table
    mapToRawCreateObjectDescriptorOperation: {
        value: function (dataOperation) {
            var objectDescriptor = dataOperation.data,
                mapping = objectDescriptor && this.mappingWithType(objectDescriptor),
                parentDescriptor,
                tableName = this.tableForObjectDescriptor(objectDescriptor),
                propertyDescriptors = Array.from(objectDescriptor.propertyDescriptors),
                i, countI, iPropertyDescriptor, iObjectRule, iRule, iIndex,
                //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
                databaseName = "postgres",
                //Hard coded for now, should be derived from a mapping telling us n which schemaName that objectDescriptor is stored
                schemaName = "phront",
                rawDataOperation = this.rawDataOperationForDatabaseSchema(databaseName, schemaName),
                sql = "",
                indexSQL = "",
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
                colunmns = new Set(),
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
CREATE UNIQUE INDEX "${tableName}_id_idx" ON "${tableName}" (id);
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

            //Cummulate inherited propertyDescriptors:
            parentDescriptor = objectDescriptor.parent;
            while ((parentDescriptor)) {
                if (parentDescriptor.propertyDescriptors && propertyDescriptors.length) {
                    propertyDescriptors.concat(parentDescriptor.propertyDescriptors);
                }
                parentDescriptor = parentDescriptor.parent;
            }

            //Before we start the loop, we add the primaryKey:
            colunmns.add("id");


            for (i = propertyDescriptors.length - 1; (i > -1); i--) {
                iPropertyDescriptor = propertyDescriptors[i];
                iObjectRule = mapping.objectMappingRules.get(iPropertyDescriptor.name);
                iRule = iObjectRule && mapping.rawDataMappingRules.get(iObjectRule.sourcePath);


                if (iRule) {
                    columnName = iObjectRule.sourcePath;
                } else {
                    columnName = iPropertyDescriptor.name;
                }


                /*
                    Some many-to-many use the primary key as a way
                    to find other rows in other table that have either an embedded foreign key (1-n), or an array of them (n-n). In which case the id is used in the right side, with a converter. So if
                    we're in that situation, let's move on and avoid
                    re-creating another column "id".

                    We've been stretching the use of expression-data-mapping, we might need
                    another mapping for the sake of storage, with a bunch of default, but can be overriden.

                    So as a better check, once we created a column, we track it so if somehow multiple mappings use it,
                    we won't create it multiple times.
                */
               if(colunmns.has(columnName)) {
                continue;
                }
                else {
                    colunmns.add(columnName);
                }
            //    if(columnName === "id" && iRule.reverter && iRule.reverter instanceof RawForeignValueToObjectConverter) {
            //         continue;
            //    }

                columnType = this.mapPropertyDescriptorToRawType(iPropertyDescriptor, iRule);
                columnSQL += `  `;
                columnSQL += escapeIdentifier(columnName) + " " + columnType;

                if (columnType === 'text') {
                    columnSQL += ' COLLATE pg_catalog."default"';
                }

                // if(propertyValueDescriptor = iPropertyDescriptor.valueDescriptor) {
                //   if(iPropertyDescriptor.cardinality === 1) {
                //     columnType = "uuid";
                //   }
                //   else {
                //     columnType = "uuid[]";
                //   }
                //   columnSQL+= columnName + " "+columnType;
                // }
                // else {
                //   columnType = this.mapPropertyDescriptorTypeToRawType(iPropertyDescriptor.valueType);
                //   columnSQL+= columnName + " "+columnType;
                //   if(columnType === 'text') {
                //     columnSQL += ' COLLATE pg_catalog."default"';
                //   }
                // }
                // if(i<countI-1) {
                //   columnSQL += ',\n';
                // }
                if (i > 0) {
                    columnSQL += ',\n';
                }


                iIndex = this.mapSearchablePropertyDescriptorToRawIndex(iPropertyDescriptor, iRule);
                if(iIndex) {
                    if (indexSQL.length) {
                        indexSQL += "\n";
                    }
                    indexSQL += iIndex;
                }

            }

            sql += createTableTemplatePrefix;

            //If we added more to ",\n"
            if (columnSQL.length > 2) {
                sql += columnSQL;
            }
            sql += createTableTemplateSuffix;

            //Now add indexes:
            if(indexSQL.length) {
                sql += indexSQL;
            }

            rawDataOperation.sql = sql;
            rawDataOperation.continueAfterTimeout = continueAfterTimeout;
            rawDataOperation.includeResultMetadata = includeResultMetadata;
            //rawDataOperation.parameters = parameters;

            return rawDataOperation;
        }
    },
    performCreateObjectDescriptorOperation: {
        value: function (dataOperation, callback) {
            return this._executeStatement(dataOperation, callback);
        }
    },

    /**
     * Handles the mapping and execution of a DataOperation to create.
     * an ObectDescriptor.
     *
     * @method
     * @argument {DataOperation} dataOperation - The dataOperation to execute
  `  * @returns {Promise} - The Promise for the execution of the operation
     */
    handleCreateObjectDescriptorOperation: {
        value: function (createOperation) {
            var self = this,
                rawDataOperation = this.mapToRawCreateObjectDescriptorOperation(createOperation);
            //console.log("rawDataOperation: ",rawDataOperation);
            return new Promise(function (resolve, reject) {
                self.performCreateObjectDescriptorOperation(rawDataOperation, function (err, data) {
                    var operation = new DataOperation();
                    operation.dataDescriptor = createOperation.dataDescriptor;
                    operation.referrerId = createOperation.id;

                    if (err) {
                        // an error occurred
                        console.log(err, err.stack, rawDataOperation);
                        operation.type = DataOperation.Type.CreateFailed;
                        //Should the data be the error?
                        operation.data = err;
                        reject(operation);
                    }
                    else {
                        // successful response
                        //console.log(data);
                        operation.type = DataOperation.Type.CreateCompleted;
                        //Not sure there's much we can provide as data?
                        operation.data = operation.dataDescriptor;

                        resolve(operation);
                    }
                });
            });
        }
    },


    /*
        Modifying a table, when adding a property descriptor to an objectdescriptor
        ALTER TABLE table_name
        ADD COLUMN new_column_name data_type;


        //Query to get all tables:
        SELECT * FROM information_schema.tables where table_schema = 'phront';

        //Query to get a table's columns:
        SELECT * FROM information_schema.columns WHERE table_schema = 'phront' AND table_name = 'Event'

        Tables: Postgres table information can be retrieved either from the information_schema.tables view, or from the pg_catalog.pg_tables view. Below are example queries:

        select * from information_schema.tables;

        select * from pg_catalog.pg_tables;


        Schemas: This query will get the user's currently selected schema:

        select current_schema();

        These queries will return all schemas in the database:

        select * from information_schema.schemata;

        select * from pg_catalog.pg_namespace


        Databases: This query will get the user's currently selected database:

        select current_database();

        This query will return all databases for the server:

        select * from pg_catalog.pg_database


        Views: These queries will return all views across all schemas in the database:

        select * from information_schema.views

        select * from pg_catalog.pg_views;

        Columns for Tables

        This query will return column information for a table named employee:


        SELECT
            *
        FROM
            information_schema.columns
        WHERE
            table_name = 'employee'
        ORDER BY
            ordinal_position;

        Indexes

        This query will return all index information in the database:


        select * from pg_catalog.pg_indexes;

        Functions

        This query will return all functions in the database. For user-defined functions, the routine_definition column will have the function body:


        select * from information_schema.routines where routine_type = 'FUNCTION';

        Triggers

        This query will return all triggers in the database. The action_statement column contains the trigger body:


        select * from information_schema.triggers;

    */

    /**
     * Handles the mapping of a create operation to SQL.
     *
     * @method
     * @argument  {DataOperation} dataOperation - The dataOperation to map to sql
     * @argument  {DataOperation} record - The object where mapping is done
  `  * @returns   {Steing} - The SQL to perform that operation
     * @private
     */

    _mapCreateOperationToSQL: {
        value: function (createOperation, rawDataOperation, recordArgument) {
            var data = createOperation.data,
                self = this,
                mappingPromise,
                record = recordArgument || {},
                sql;

            mappingPromise = this._mapObjectToRawData(data, record);
            if (!mappingPromise) {
                mappingPromise = this.nullPromise;
            }
            return mappingPromise.then(function () {

                //If the client hasn't provided one, we do:
                if (!record.id) {
                    record.id = uuid.generate();
                }

                var objectDescriptor = self.objectDescriptorWithModuleId(createOperation.dataDescriptor),
                    tableName = self.tableForObjectDescriptor(objectDescriptor),
                    schemaName = rawDataOperation.schema,
                    recordKeys = Object.keys(record),
                    escapedRecordKeys = recordKeys.map(key => escapeIdentifier(key)),
                    recordKeysValues = Array(recordKeys.length),
                    mapping = objectDescriptor && self.mappingWithType(objectDescriptor),
                    sqlColumns = recordKeys.join(","),
                    i, countI, iKey, iValue, iMappedValue, iRule, iPropertyName, iPropertyDescriptor, iRawType,
                    rawDataPrimaryKeys = mapping.rawDataPrimaryKeys,
                    sql;


                for (i = 0, countI = recordKeys.length; i < countI; i++) {
                    iKey = recordKeys[i];
                    iValue = record[iKey];

                    iRawType = self.mapObjectDescriptorRawPropertyToRawType(objectDescriptor, iKey, mapping);

                    iMappedValue = self.mapPropertyValueToRawTypeExpression(iKey, iValue, iRawType);
                    // if(iValue == null || iValue == "") {
                    //   iValue = 'NULL';
                    // }
                    // else if(typeof iValue === "string") {
                    //   iValue = escapeString(iValue);
                    //   iValue = `${iValue}`;
                    //   // iValue = escapeString(iValue);
                    //   // iValue = `'${iValue}'`;
                    // }
                    // else {
                    //   iValue = prepareValue(iValue);
                    // }
                    recordKeysValues[i] = iMappedValue;
                }

                /*
                    INSERT INTO table (column1, column2, …)
                    VALUES
                    (value1, value2, …),
                    (value1, value2, …) ,...;
                */


                sql = `INSERT INTO ${schemaName}."${tableName}" (${escapedRecordKeys.join(",")}) VALUES (${recordKeysValues.join(",")}) RETURNING id`;

                return sql;
            });
        }
    },

    /**
     * Handles the mapping and execution of a Create DataOperation.
     *
     * @method
     * @argument {DataOperation} dataOperation - The dataOperation to execute
  `  * @returns {Promise} - The Promise for the execution of the operation
     */
    handleCreate: {
        value: function (createOperation) {
            var data = createOperation.data;

            if (createOperation.data === createOperation.dataDescriptor) {
                createOperation.data = this.objectDescriptorWithModuleId(createOperation.dataDescriptor);
                return this.handleCreateObjectDescriptorOperation(createOperation);
            } else {
                var rawDataOperation = {},
                    objectDescriptor = this.objectDescriptorWithModuleId(createOperation.dataDescriptor);

                //This adds the right access key, db name. etc... to the RawOperation.
                this.mapObjectDescriptorToRawOperation(objectDescriptor, rawDataOperation);


                var self = this,
                    record = {};

                /*
                  Pointers to INSERT
                  https://www.postgresql.org/docs/8.2/sql-insert.html

                  Smarts:

                  1/ INSERT INTO public."Item" ("Id", name)
                      VALUES  ('1', 'name1'),
                              ('2', 'name2'),
                              ('3','name3')

                ` 2/How do I insert multiple values into a postgres table at once?
                    https://stackoverflow.com/questions/20815028/how-do-i-insert-multiple-values-into-a-postgres-table-at-once
                    INSERT INTO user_subservices(user_id, subservice_id)
                    SELECT 1 id, x
                    FROM    unnest(ARRAY[1,2,3,4,5,6,7,8,22,33]) x

                  3/ To get the created ID, use the RETURNING clause
                    https://www.postgresql.org/docs/9.4/dml-returning.html
                    INSERT INTO users (firstname, lastname) VALUES ('Joe', 'Cool') RETURNING id;
                */
                rawDataOperation.sql = this._mapCreateOperationToSQL(createOperation, rawDataOperation, record);
                //console.log(sql);
                return new Promise(function (resolve, reject) {
                    self._executeStatement(rawDataOperation, function (err, data) {
                        var operation = self.mapHandledCreateResponseToOperation(createOperation, err, data, record);
                        resolve(operation);
                    });
                });
            }
        }
    },

    mapHandledCreateResponseToOperation: {
        value: function(createOperation, err, data, record) {
            var operation = new DataOperation();
            operation.referrerId = createOperation.id;
            operation.clientId = createOperation.clientId;

            operation.dataDescriptor = createOperation.dataDescriptor;
            if (err) {
                // an error occurred
                console.log(err, err.stack, rawDataOperation);
                operation.type = DataOperation.Type.CreateFailed;
                //Should the data be the error?
                operation.data = err;
            }
            else {
                // successful response
                operation.type = DataOperation.Type.CreateCompleted;
                //We provide the inserted record as the operation's payload
                operation.data = record;
            }
            return operation;
        }
    },

    _mapResponseHandlerByOperationType: {
        value: new Map()
    },

    mapResponseHandlerForOperation: {
        value: function(operation) {
            return this._mapResponseHandlerByOperationType.get(operation.type);
        }
    },

    mapOperationResponseToOperation: {
        value: function(operation, err, data, record) {
            return this.mapResponseHandlerForOperation(operation).apply(this, arguments);
        }
    },


    /*
        Postgresql Array:
        https://www.postgresql.org/docs/9.2/functions-array.html#ARRAY-FUNCTIONS-TABLE
        https://heap.io/blog/engineering/dont-iterate-over-a-postgres-array-with-a-loop
        https://stackoverflow.com/questions/3994556/eliminate-duplicate-array-values-in-postgres

        @>	contains	ARRAY[1,4,3] @> ARRAY[3,1]

    */

    /*

        UPDATE table
            SET column1 = value1,
                column2 = value2 ,...
            WHERE
            condition;

    */




    /**
     * Handles the mapping of an update operation to SQL.
     *
     * @method
     * @argument  {DataOperation} dataOperation - The dataOperation to map to sql
     * @argument  {DataOperation} record - The object where mapping is done
  `  * @returns   {Steing} - The SQL to perform that operation
     * @private
     */

    _mapUpdateOperationToSQL: {
        value: function (updateOperation, rawDataOperation, record) {
            var data = updateOperation.data,
                self = this,
                mappingPromise,
                sql,
                objectDescriptor = this.objectDescriptorWithModuleId(updateOperation.dataDescriptor),
                mapping = objectDescriptor && self.mappingWithType(objectDescriptor),
                criteria = updateOperation.criteria,
                dataChanges = data,
                changesIterator,
                aProperty, aValue, addedValues, removedValues, aPropertyDescriptor,
                //Now we need to transform the operation into SQL:
                tableName = this.tableForObjectDescriptor(objectDescriptor),
                schemaName = rawDataOperation.schema,
                recordKeys = Object.keys(dataChanges),
                setRecordKeys = Array(recordKeys.length),
                sqlColumns = recordKeys.join(","),
                i, countI, iKey, iKeyEscaped, iValue, iMappedValue, iAssignment, iPrimaryKey, iPrimaryKeyValue,
                iKeyValue,
                dataSnapshot = updateOperation.snapshot,
                dataSnapshotKeys = dataSnapshot ? Object.keys(dataSnapshot) : null,
                condition,
                sql;


            //We need to transform the criteria into a SQL equivalent. Hard-coded for a single object for now
            if (Object.keys(criteria.parameters).length === 1) {
                if (criteria.parameters.hasOwnProperty("identifier")) {
                    condition = `id = '${criteria.parameters.dataIdentifier.primaryKey}'::uuid`;
                }
                else if (criteria.parameters.hasOwnProperty("id")) {
                    condition = `id = '${criteria.parameters.id}'::uuid`;
                }
            }

            if (dataSnapshotKeys) {
                for (i = 0, countI = dataSnapshotKeys.length; i < countI; i++) {
                    if (condition && condition.length) {
                        condition += " AND ";
                    }
                    else {
                        condition = "";
                    }

                    iKey = dataSnapshotKeys[i];
                    iValue = dataSnapshot[iKey];
                    condition += `${escapeIdentifier(iKey)} = ${this.mapPropertyValueToRawTypeExpression(iKey, iValue)}`;
                }
            }

            /*
            this adds a value if it's not there
              UPDATE "user"
              SET    topics = topics || topicId
              WHERE  uuid = id
              AND    NOT (topics @> ARRAY[topicId]);

              //Apparenly array_agg is more performant
              //Add:
              update tabl1
              set    arr_str = (select array_agg(distinct e) from unnest(arr_str || '{b,c,d}') e)
              where  not arr_str @> '{b,c,d}';

              //Remove:
              update tabl1
              set    arr_str = arr_str || array(select unnest('{b,c,d}'::text[]) except select unnest(arr_str))
              where  not arr_str @> '{b,c,d}';


            */

            for (i = 0, countI = recordKeys.length; i < countI; i++) {
                iKey = recordKeys[i];
                iKeyEscaped = escapeIdentifier(iKey);
                iValue = dataChanges[iKey];
                if (iValue.hasOwnProperty("addedValues")) {
                    iMappedValue = this.mapPropertyValueToRawTypeExpression(iKey, iValue.addedValues);
                    iAssignment = `${iKeyEscaped} = array_append(${iKeyEscaped}, ${iMappedValue})`;
                }
                if (iValue.hasOwnProperty("removedValues")) {
                    iMappedValue = this.mapPropertyValueToRawTypeExpression(iKey, iValue.removedValues);
                    iAssignment = `${iKeyEscaped} = array_remove(${iKeyEscaped}, ${iMappedValue})`;
                } else if (iValue === null) {
                    iAssignment = `${iKeyEscaped} = NULL`;
                } else {
                    iRawType = this.mapObjectDescriptorRawPropertyToRawType(objectDescriptor, iKey, mapping);

                    iMappedValue = this.mapPropertyValueToRawTypeExpression(iKey, iValue, iRawType);
                    //iAssignment = `${iKey} = '${iValue}'`;
                    iAssignment = `${iKeyEscaped} = ${iMappedValue}`;
                }
                setRecordKeys[i] = iAssignment;
            }

            if (!setRecordKeys || setRecordKeys.length === 0) {
                var operation = new DataOperation();
                operation.type = DataOperation.Type.UpdateCanceled;
                operation.reason = "No update provided";

                return Promise.resolve(operation);
            }


            sql = `UPDATE  ${schemaName}."${tableName}" SET ${setRecordKeys.join(",")} WHERE (${condition})`;
            return Promise.resolve(sql);
        }
    },


    handleUpdate: {
        value: function (updateOperation) {
            var data = updateOperation.data;

            //As target should be the ObjectDescriptor in both cases, whether the
            //operation is an instance or ObjectDescriptor operation
            //I might be better to rely on the presence of a criteria or not:
            //No criteria means it's really an operation on the ObjectDescriptor itself
            //and not on an instance
            if (data instanceof ObjectDescriptor) {
                return this.handleUpdateObjectDescriptorOperation(updateOperation);
            } else {
                var rawDataOperation = {},
                    criteria = updateOperation.criteria,
                    dataChanges = data,
                    changesIterator,
                    objectDescriptor = this.objectDescriptorWithModuleId(updateOperation.dataDescriptor),
                    aProperty, aValue, addedValues, removedValues, aPropertyDescriptor,
                    record = {};

                //This adds the right access key, db name. etc... to the RawOperation.
                this.mapObjectDescriptorToRawOperation(objectDescriptor, rawDataOperation);



                rawDataOperation.sql = this._mapUpdateOperationToSQL(updateOperation, rawDataOperation, record);
                //console.log(sql);
                return new Promise(function (resolve, reject) {
                    self._executeStatement(rawDataOperation, function (err, data) {
                        var operation = self.mapHandledUpdateResponseToOperation(updateOperation, err, data, record);
                        resolve(operation);
                    });
                });
            }
        }
    },

    mapHandledUpdateResponseToOperation: {
        value: function(updateOperation, err, data, record) {
            var operation = new DataOperation();
            operation.referrerId = updateOperation.id;
            operation.clientId = updateOperation.clientId;
            operation.dataDescriptor = objectDescriptor.module.id;
            if (err) {
                // an error occurred
                console.log(err, err.stack, rawDataOperation);
                operation.type = DataOperation.Type.UpdateFailed;
                //Should the data be the error?
                operation.data = err;
            }
            else {
                // successful response
                operation.type = DataOperation.Type.UpdateCompleted;
                //We provide the inserted record as the operation's payload
                operation.data = record;

            }
            return operation;
        }
    },


    /**
     * Handles the mapping of a delete operation to SQL.
     *
     * @method
     * @argument  {DataOperation} dataOperation - The dataOperation to map to sql
     * @argument  {DataOperation} record - The object where mapping is done
  `  * @returns   {Steing} - The SQL to perform that operation
     * @private
     */

    _mapDeleteOperationToSQL: {
        value: function (deleteOperation, rawDataOperation, record) {
            var data = deleteOperation.data,
                self = this,
                mappingPromise,
                sql,
                criteria = deleteOperation.criteria,
                dataChanges = data,
                objectDescriptor = this.objectDescriptorWithModuleId(deleteOperation.dataDescriptor),
                aProperty, aValue, addedValues, removedValues, aPropertyDescriptor,
                //Now we need to transform the operation into SQL:
                tableName = this.tableForObjectDescriptor(objectDescriptor),
                schemaName = rawDataOperation.schema,
                i, countI, iKey, iKeyEscaped, iValue, iMappedValue, iAssignment, iPrimaryKey, iPrimaryKeyValue,
                iKeyValue,
                dataSnapshot = deleteOperation.snapshot,
                dataSnapshotKeys = dataSnapshot ? Object.keys(dataSnapshot) : null,
                condition;


            //We need to transform the criteria into a SQL equivalent. Hard-coded for a single object for now
            if (Object.keys(criteria.parameters).length === 1) {
                if (criteria.parameters.hasOwnProperty("identifier")) {
                    condition = `id = '${criteria.parameters.dataIdentifier.primaryKey}'::uuid`;
                }
                else if (criteria.parameters.hasOwnProperty("id")) {
                    condition = `id = '${criteria.parameters.id}'::uuid`;
                }
            }

            if (dataSnapshotKeys) {
                for (i = 0, countI = dataSnapshotKeys.length; i < countI; i++) {
                    if (condition && condition.length) {
                        condition += " AND ";
                    }
                    else {
                        condition = "";
                    }

                    iKey = dataSnapshotKeys[i];
                    iValue = dataSnapshot[iKey];
                    condition += `${escapeIdentifier(iKey)} = ${this.mapPropertyValueToRawTypeExpression(iKey, iValue)}`;
                }
            }

            sql = `DELETE FROM ${schemaName}."${tableName}"
        WHERE (${condition})`;
            return Promise.resolve(sql);
        }
    },

    handleDelete: {
        value: function (deleteOperation) {
            var data = deleteOperation.data,
                rawDataOperation = {},
                criteria = deleteOperation.criteria,
                dataChanges = data,
                objectDescriptor = this.objectDescriptorWithModuleId(deleteOperation.dataDescriptor),
                aProperty, aValue, addedValues, removedValues, aPropertyDescriptor,
                record = {};

            //This adds the right access key, db name. etc... to the RawOperation.
            this.mapObjectDescriptorToRawOperation(objectDescriptor, rawDataOperation);

            rawDataOperation.sql = this._mapDeleteOperationToSQL(deleteOperation, rawDataOperation, record);
            //console.log(sql);
            return new Promise(function (resolve, reject) {
                self._executeStatement(rawDataOperation, function (err, data) {
                    var operation = self.mapHandledDeleteResponseToOperation(deleteOperation, err, data, record);
                    resolve(operation);
                });
            });
        }
    },

    mapHandledDeleteResponseToOperation: {
        value: function(deleteOperation, err, data, record) {
            var operation = new DataOperation();
            operation.referrerId = deleteOperation.id;
            operation.clientId = deleteOperation.clientId;
            operation.dataDescriptor = objectDescriptor.module.id;
            if (err) {
                // an error occurred
                console.log(err, err.stack, rawDataOperation);
                operation.type = DataOperation.Type.DeleteFailed;
                //Should the data be the error?
                operation.data = err;
            }
            else {
                // successful response
                operation.type = DataOperation.Type.DeleteCompleted;
                //We provide the inserted record as the operation's payload
                operation.data = record;
            }
            return operation;
        }
    },

    handleCreateTransaction: {
        value: function (createTransactionOperation) {
            var self = this,
                rawDataOperation = {},
                firstObjectDescriptor,
                //For a transaction, .dataDescriptor holds an array vs a single one.
                transactionObjectDescriptors = createTransactionOperation.dataDescriptor;

            if (!transactionObjectDescriptors || !transactionObjectDescriptors.length) {
                throw new Error("Phront Service handleCreateTransaction doesn't have ObjectDescriptor info");
            }

            firstObjectDescriptor = this.objectDescriptorWithModuleId(transactionObjectDescriptors[0]);


            //This adds the right access key, db name. etc... to the RawOperation.
            //Right now we assume that all ObjectDescriptors in the transaction goes to the same DB
            //If not, it needs to be handled before reaching us with an in-memory transaction,
            //or leveraging some other kind of storage for long-running cases.
            this.mapObjectDescriptorToRawOperation(firstObjectDescriptor, rawDataOperation);

            return new Promise(function (resolve, reject) {
                self._rdsDataService.beginTransaction(rawDataOperation, function (err, data) {
                    var operation = new DataOperation();
                    operation.referrerId = createTransactionOperation.id;
                    operation.dataDescriptor = transactionObjectDescriptors;
                    if (err) {
                        // an error occurred
                        console.log(err, err.stack, rawDataOperation);
                        operation.type = DataOperation.Type.CreateTransactionFailed;
                        //Should the data be the error?
                        operation.data = data;
                        reject(operation);
                    }
                    else {
                        // successful response
                        //For CreateTreansactionCompleted, we're going to use the id provided by the backend
                        operation.id = data.transactionId;

                        operation.type = DataOperation.Type.CreateTransactionCompleted;
                        //What should be the operation's payload ? The Raw Transaction Id?
                        operation.data = data;

                        resolve(operation);
                    }
                });

            });
        }
    },

    _isAsync: {
        value: function (object) {
            return object && object.then && typeof object.then === "function";
        }
    },

    MaxSQLStatementLength: {
        value: 65536
    },

    _executeBatchStatement: {
        value: function(batchOperation, startIndex, endIndex, batchedOperations, rawDataOperation, rawOperationRecords, responseOperations) {
            var self = this;
            //Time to execute
            return new Promise(function (resolve, reject) {
                //rawDataOperation.parameterSets = [[]]; //as a work-around for batch...
                self._rdsDataService.executeStatement(rawDataOperation, function (err, data) {
                    var response = this;

                    if (err) {

                        var operation = new DataOperation();
                        operation.referrerId = batchOperation.id;
                        operation.dataDescriptor = batchOperation.dataDescriptor;
                            // an error occurred
                        console.log(err, err.stack, rawDataOperation);
                        operation.type = DataOperation.Type.BatchFailed;
                        //Should the data be the error?
                        if(!data) {
                            data = {
                                transactionId: batchOperation.data.transactionId
                            };
                            data.error = err;
                        }
                        operation.data = data;
                        reject(operation);
                    }
                    else {
                        var i, countI, iData, iOperation, readType = DataOperation.Type.Read, iFetchesults;

                        for(i=startIndex, countI = endIndex; (i<countI); i++) {
                            iRecord = rawOperationRecords[i];
                            iOperation = batchedOperations[i];

                            //Only map back for read results, if we get it from _rdsDataService.executeStatement ...
                            if(iOperation.type === readType) {
                                iFetchesults = data.records[i];
                                if(iFetchesults) {
                                    responseOperations[i] = self.mapOperationResponseToOperation(iOperation,err, data, iFetchesults);
                                }

                            }
                        }

                        if(response.hasNextPage()) {
                            response.nextPage(arguments.callee);
                        }
                        else {
                            //Nothing more to do, we resolve
                            resolve(true);
                        }

                        // executeStatementData.push(data);
                        // successful response
                        // operation.type = DataOperation.Type.BatchCompleted;
                        // //What should be the operation's payload ? The Raw Transaction Id?
                        // operation.data = data;

                        // resolve(operation);
                    }
                });
            });
        }
    },

    handleBatch: {
        value: function (batchOperation) {
            var self = this,
                batchedOperations = batchOperation.data.batchedOperations,
                iOperation, iSQL,
                batchSQL = "",
                createOperationType = DataOperation.Type.Create,
                updateOperationType = DataOperation.Type.Update,
                deleteOperationType = DataOperation.Type.Delete,
                transactionId = batchOperation.data.transactionId,
                rawDataOperation = {},
                firstObjectDescriptor,
                rawOperationRecords = [],
                i, countI, sqlMapPromises = [], iRecord,
                createdCount = 0,
                //For a transaction, .dataDescriptor holds an array vs a single one.
                transactionObjectDescriptors = batchOperation.dataDescriptor;

            if (!transactionObjectDescriptors || !transactionObjectDescriptors.length) {
                throw new Error("Phront Service handleCreateTransaction doesn't have ObjectDescriptor info");
            }

            firstObjectDescriptor = this.objectDescriptorWithModuleId(transactionObjectDescriptors[0]);


            //This adds the right access key, db name. etc... to the RawOperation.
            //Right now we assume that all ObjectDescriptors in the transaction goes to the same DB
            //If not, it needs to be handled before reaching us with an in-memory transaction,
            //or leveraging some other kind of storage for long-running cases.
            if (transactionId) {
                rawDataOperation.transactionId = transactionId;
            }

            this.mapObjectDescriptorToRawOperation(firstObjectDescriptor, rawDataOperation);

            //Now loop on operations and create the matching sql:
            for (i = 0, countI = batchedOperations && batchedOperations.length; (i < countI); i++) {
                iOperation = batchedOperations[i];
                iRecord = {};
                rawOperationRecords[i] = iRecord;
                if (iOperation.type === updateOperationType) {
                    sqlMapPromises.push(this._mapUpdateOperationToSQL(iOperation, rawDataOperation,iRecord ));
                } else if (iOperation.type === createOperationType) {
                    sqlMapPromises.push(this._mapCreateOperationToSQL(iOperation, rawDataOperation, iRecord));
                    createdCount++;
                } else if (iOperation.type === deleteOperationType) {
                    sqlMapPromises.push(this._mapDeleteOperationToSQL(iOperation, rawDataOperation, iRecord));
                } else {
                    console.error("-handleBatch: Operation With Unknown Type: ", iOperation);
                }
            }

            return Promise.all(sqlMapPromises)
                .then(function (operationSQL) {
                    var i, countI, iBatch = "", iStatement,
                    MaxSQLStatementLength = self.MaxSQLStatementLength,
                    batchPromises = [],
                    operationData = "",
                    executeStatementErrors = [],
                    executeStatementData = [],
                    responseOperations = [],
                    iBatchRawDataOperation,
                    startIndex,
                    endIndex,
                    lastIndex;

                    for(i=0, startIndex=0, countI = operationSQL.length, lastIndex = countI-1;(i<countI); i++) {

                        if(iBatch.length) {
                            iBatch += ";\n";
                        }
                        iStatement = operationSQL[i];
                        if( ((iStatement.length+iBatch.length) > MaxSQLStatementLength) || (i === lastIndex) ) {

                            if(i === lastIndex) {
                                iBatch += iStatement;
                                iBatch += ";\n";
                                endIndex = i;
                            } else {
                                endIndex = i-1;
                            }
                            //Time to execute what we have before it becomes too big:
                            iBatchRawDataOperation = {};
                            Object.assign(iBatchRawDataOperation,rawDataOperation);
                            iBatchRawDataOperation.sql = iBatch;

                            //Right now _executeBatchStatement will create symetric response operations if we pass responseOperations as an argument. This is implemented by using the data of the original create/update operations to eventually send it back. We can do without that, but we need to re-test that when we do batch of fetches and re-activate it.
                            batchPromises.push(self._executeBatchStatement(batchOperation, startIndex, endIndex, batchedOperations, iBatchRawDataOperation, rawOperationRecords, responseOperations));

                            //Now we continue:
                            iBatch = iStatement;
                            startIndex = i;
                        } else {
                                iBatch += iStatement;
                        }
                    }

                    return Promise.all(batchPromises)
                    .then(function() {
                        // if(executeStatementErrors.length) {
                        //     operation.type = DataOperation.Type.BatchFailed;
                        //     //Should the data be the error?
                        //     if(!data) {
                        //         data = {
                        //             transactionId: transactionId
                        //         };
                        //         data.error = executeStatementErrors;
                        //     }
                        //     operation.data = data;

                        // }
                        // else {
                            // successful response
                            var operation = new DataOperation();
                            operation.referrerId = batchOperation.id;
                            operation.dataDescriptor = transactionObjectDescriptors;
                            operation.type = DataOperation.Type.BatchCompleted;

                            /*
                                Aurora DataAPI doesn't really return much when it comes to a
                                updates and inserts, not that we need it to. When a batch operation is part of a saveChanges, the client has what it needs already, in which case, we don't need to send back much, except the transactionId. Which is better anyway, but it's also
                                a problem if we did as we run into the AWS API Gateway websocket payload limits. And so far we've worked around the pbm for a ReadCompleted by creating ReadUpdate in-between, ending by a read completed.

                                We can do the same with a batch, but we don't have for a batch the kind of object like a DataStream that we have for a fetch/read.

                                However, if we can execute a batch of reads/fetch, so the client sends  all the fetch at once, which will spare spawning too much lambda functions, we'll run into the same problem on the way back, unless we send back the individual reponses as read update/completed themselves, only using the batchCompleted
                                as away to know we're done. Because on the client side, they are individual reqquests created by triggers for example and client code rely on getting a response to these specifically.

                                for now, if we have a transactionId, it means a "saveChanges" we only send that back as this is the cue that we are in a saveChanges.
                            */
                            //responseOperations should be empty except for batched readcompleted operations
                            operation.data = responseOperations;
                            if (transactionId) {
                                operation.data.transactionId = transactionId;
                            }

                        //}



                        return operation;

                    },function(batchFailedOperation) {
                        return Promise.resolve(batchFailedOperation);
                    });

                    /*
                    batchSQL = operationSQL.join(";\n");
                    rawDataOperation.sql = batchSQL;

                    return new Promise(function (resolve, reject) {
                        //rawDataOperation.parameterSets = [[]]; //as a work-around for batch...
                        self._rdsDataService.executeStatement(rawDataOperation, function (err, data) {
                            if (data && transactionId) {
                                data.transactionId = transactionId;
                            }
                            if (err) {
                                // an error occurred
                                console.log(err, err.stack, rawDataOperation);
                                operation.type = DataOperation.Type.BatchFailed;
                                //Should the data be the error?
                                if(!data) {
                                    data = {
                                        transactionId: transactionId
                                    };
                                    data.error = err;
                                }
                                operation.data = data;
                                resolve(operation);
                            }
                            else {
                                // successful response
                                operation.type = DataOperation.Type.BatchCompleted;
                                //What should be the operation's payload ? The Raw Transaction Id?
                                operation.data = data;

                                resolve(operation);
                            }
                        });
                    });
                    */

                }, function (sqlMapError) {
                    return Promise.reject(sqlMapError);
                });
        }
    },

    _handleTransactionEndOperation: {
        value: function (transactionEndOperation) {
            var self = this,
                rawDataOperation = {},
                firstObjectDescriptor,
                transactionId = transactionEndOperation.data.transactionId,
                //For a transaction, .dataDescriptor holds an array vs a single one.
                transactionObjectDescriptors = transactionEndOperation.dataDescriptor;

            if (!transactionObjectDescriptors || !transactionObjectDescriptors.length) {
                throw new Error("Phront Service handletransactionEndOperation doesn't have ObjectDescriptor info");
            }

            firstObjectDescriptor = this.objectDescriptorWithModuleId(transactionObjectDescriptors[0]);


            //This adds the right access key, db name. etc... to the RawOperation.
            //Right now we assume that all ObjectDescriptors in the transaction goes to the same DB
            //If not, it needs to be handled before reaching us with an in-memory transaction,
            //or leveraging some other kind of storage for long-running cases.
            if (transactionId) {
                rawDataOperation.transactionId = transactionId;
            }

            this.mapObjectDescriptorToRawOperation(firstObjectDescriptor, rawDataOperation);

            //_rdsDataService.commitTransaction & _rdsDataService.rollbackTransaction make sure the param
            //don't have a database nor schema field, so we delete it.
            //TODO, try to find a way to instruct this.mapObjectDescriptorToRawOperation snot to put them in if we don't want them
            delete rawDataOperation.database;
            delete rawDataOperation.schema;

            return new Promise(function (resolve, reject) {
                var method = transactionEndOperation.type === DataOperation.Type.PerformTransaction
                    ? "commitTransaction"
                    : "rollbackTransaction";
                self._rdsDataService[method](rawDataOperation, function (err, data) {
                    var operation = new DataOperation();
                    operation.referrerId = transactionEndOperation.id;
                    operation.dataDescriptor = transactionObjectDescriptors;
                    if (data && transactionId) {
                        data.transactionId = transactionId;
                    }
                    if (err) {
                        // an error occurred
                        console.log(err, err.stack, rawDataOperation);
                        operation.type = transactionEndOperation.type === DataOperation.Type.PerformTransaction ? DataOperation.Type.PerformTransactionFailed : DataOperation.Type.RollbackTransactionFailed;
                        //Should the data be the error?
                        operation.data = data;
                        resolve(operation);
                    }
                    else {
                        // successful response
                        operation.type = transactionEndOperation.type === DataOperation.Type.PerformTransaction ? DataOperation.Type.PerformTransactionCompleted : DataOperation.Type.RollbackTransactionCompleted;
                        //What should be the operation's payload ? The Raw Transaction Id?
                        operation.data = data;

                        resolve(operation);
                    }
                });

            });
        }
    },

    handlePerformTransaction: {
        value: function (performTransactionOperation) {
            return this._handleTransactionEndOperation(performTransactionOperation);
        }
    },

    handleRollbackTransaction: {
        value: function (rollbackTransactionOperation) {
            return this._handleTransactionEndOperation(rollbackTransactionOperation);
        }
    },

    // Export promisified versions of the RDSDataService methods
    batchExecuteStatement: {
        value: function (params) {
            this._rdsDataService.batchExecuteStatement(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                }
                else {
                } console.log(data);           // successful response
            });
        }
    },

    beginTransaction: {
        value: function (params) {
            this._rdsDataService.beginTransaction(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                }
                else {
                } console.log(data);           // successful response
            });
        }
    },

    commitTransaction: {
        value: function (params) {
            this._rdsDataService.commitTransaction(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                }
                else {
                } console.log(data);           // successful response
            });
        }
    },
    _executeStatement: {
        value: function (params, callback) {
            this._rdsDataService.executeStatement(params, callback);
        }
    },
    rollbackTransaction: {
        value: function (params) {
            this._rdsDataService.rollbackTransaction(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                }
                else {
                    console.log(data);           // successful response
                }
            });
        }
    }

});


Object.assign(PhrontService.prototype, pgstringify);

