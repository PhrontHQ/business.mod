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

    //Not needed at all as not used
    // XMLHttpRequest = require("xhr2"),
    // querystring = require('querystring'),
    // Require sqlstring to add additional escaping capabilities
    //sqlString = require('sqlstring'),

    
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    uuid = require("montage/core/uuid"),


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
    PhrontService;



    //Node.js specific
    if(https) {
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

    fetchData: {
      value: function (query, stream) {
          var self = this,
            objectDescriptor = query.type,
            readOperation = new DataOperation();

          //We need to turn this into a Read Operation. Difficulty is to turn the query's criteria into
          //one that doesn't rely on objects. What we need to do before handing an operation over to another context
          //bieng a worker on the client side or a worker on the server side, is to remove references to live objects.
          //One way to do this is to replace every object in a criteria's parameters by it's data identifier.
          //Another is to serialize the criteria.
          readOperation.type = DataOperation.Type.Read;
          readOperation.objectDescriptor = objectDescriptor;
          readOperation.criteria = query.criteria;

          //Where do we put the "select part" ? The list of properties, default + specific ones asked by developer and
          //eventually collected by the framework through triggers?
          // - prefetchExpressions is a list like that on the query object.
          // - selectBindings s another.


          // return new Promise(function(resolve,reject) {

            self.handleReadOperation(readOperation) 
            .then(function(readUpdatedOperation) {
              var records = readUpdatedOperation.data;

              if(records && records.length > 0) {

                  //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
                  self.addRawData(stream, records, readOperation._rawReadExpressionIndexMap);   
              }

              self.rawDataDone(stream);    

            }, function(readFailedOperation) {
              console.error(readFailedOperation);
              self.rawDataDone(stream);    

            });
        // });

        return stream;
      }
    },



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
          condition;
        //Going to be ugly...
          //We need to transform the criteria into a SQL equivalent. Hard-coded for a single object for now

          //Hard coded Find an object with it's originId:
          if(criteria && criteria.parameters && Object.keys(criteria.parameters).length === 1 && criteria.parameters.hasOwnProperty("originId")) {
            condition = `"originId" = '${criteria.parameters.originId}'`;
          }
          else if(syntax && syntax.type == "equals") {
            var args = syntax.args;
            
            if(args[0].type === "property") {
              propertyName = args[0].args[1].value;
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
            }
            if(args[1].type === "parameters") {
              value = criteria.parameters;
              escapedValue = this.mapPropertyValueToRawTypeExpression(rawProperty,value);
            }

            if(propertyDescriptor && propertyDescriptor.valueType == "string") {
                condition = `${escapedRawProperty} ilike ${escapedValue}`
            }
            else {
                condition = `${escapedRawProperty} = ${escapedValue}`
            }

          }
          else if(syntax && syntax.type == "has") {
            var args = syntax.args;
            propertyName = args[1].args[1].value;
            rawProperty = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
            escapedRawProperty = escapeIdentifier(rawProperty);

            if(args[0].type === "parameters") {
              value = criteria.parameters;
              escapedValue = this.mapPropertyValueToRawTypeExpression(rawProperty,value,"list");
            }


            condition = `${escapedRawProperty} in ${escapedValue}`

          }
          else if((criteria && criteria.expression) || (criteria && criteria.syntax) || (criteria && criteria.parameters)) {
            console.error("missing implementation of criteria ",criteria);
          }
          return condition;
      }
    },

    HAS_DATA_API_UUID_ARRAY_BUG: {
      value: false
    },

    mapReadOperationToRawStatement: {
      value: function(readOperation,rawDataOperation) {
          //Now we need to transform the operation into SQL:
          var objectDescriptor = readOperation.objectDescriptor,
          mapping = this.mappingWithType(objectDescriptor),
          rawDataPrimaryKeys = mapping.rawDataPrimaryKeys,
          operationName = readOperation.name,
          //We start by the mandatory, but the read operation could have
          //further information about what to retur, including new constructs based on expressions.
          rawReadExpressions = new Set(mapping.rawRequisitePropertyNames),//Set
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

          //Adds the primaryKeys to the columns fetched
          rawDataPrimaryKeys.forEach(item => rawReadExpressions.add(item));

          //Make it an Array
          // rawReadExpressionsArray = Array.from(rawReadExpressions);
          rawReadExpressionsArray = [];
          escapedRawReadExpressionsArray = [];
          rawReadExpressionsIterator = rawReadExpressions.values();
          i=0;
          while(anExpression = rawReadExpressionsIterator.next().value) {
            rawReadExpressionsArray.push(anExpression);
            //rawReadExpressionMap.set(anExpression,i);

            if(HAS_DATA_API_UUID_ARRAY_BUG) {
              /*
                We need to wrap any toMany holding uuids in an array like this:
                CAST (\"addressIds\" AS text[])
              */
                var rule = mapping.rawDataMappingRules.get(anExpression),
                    propertyName = rule ? rule.sourcePath : anExpression,
                    propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName);
                //id / primary keys don't have property descriptors
                if(propertyDescriptor && propertyDescriptor.valueDescriptor && propertyDescriptor.cardinality > 1) {
                  anEscapedExpression = `CAST (${escapeIdentifier(anExpression)} AS text[])`;
                }
                else {
                  anEscapedExpression = escapeIdentifier(anExpression);
                }
            }
            else {
              anEscapedExpression = escapeIdentifier(anExpression)
            }
            escapedRawReadExpressionsArray.push(anEscapedExpression);

            i++;
          }





          /*
          SELECT f.title, f.did, d.name, f.date_prod, f.kind
              FROM distributors d, films f
              WHERE f.did = d.did
          */

          condition = this.mapCriteriaToRawStatement(criteria, mapping);

          sql = `SELECT (SELECT row_to_json(_) FROM (SELECT ${escapedRawReadExpressionsArray.join(",")}) as _) FROM ${schemaName}."${tableName}"`;
          if(condition) {
            sql += ` WHERE (${condition})`;
          }
          //sql = `SELECT ${escapedRawReadExpressionsArray.join(",")} FROM ${schemaName}."${tableName}" WHERE (${condition})`;

          rawDataOperation.sql = sql;

          //return rawReadExpressionMap;
      }
    },

    _handleReadOperationCount: {
      value:0
    },

    handleReadOperation: {
      value: function(readOperation) {
        var data = readOperation.data,
            rawReadExpressionMap;

        //No implementation/formalization yet to read the schema and retrieve ObjectDescriptors
        //Built from an existing schema. How would we express that in a read criteria? What would be the
        //objectDescriptor property? The model? Does naming that property that way actually work?
        // if(data instanceof ObjectDescriptor) {
        //   return this.handleReadObjectDescriptorOperation(readOperation);
        // } else {
          var rawDataOperation = {},
              dataChanges = data,
              changesIterator,
              aProperty, aValue, addedValues, removedValues, aPropertyDescriptor,
              self = this;

          //This adds the right access key, db name. etc... to the RawOperation.
          this.mapObjectDescriptorToRawOperation(readOperation.objectDescriptor,rawDataOperation);
          this.mapReadOperationToRawStatement(readOperation,rawDataOperation);

          return new Promise(function(resolve,reject) {
           //var timeID = self._handleReadOperationCount++;
            //console.time("PhrontService handleReadOperation "+timeID);

            // if(rawDataOperation.sql.indexOf('"name" = ') !== -1 && rawDataOperation.sql.indexOf("Organization") !== -1) {
            //   console.log(rawDataOperation.sql);
            // }
            console.log("executeStatement "+rawDataOperation.sql);

            self._executeStatement(rawDataOperation, function(err, data) {
              //console.timeEnd("PhrontService handleReadOperation "+timeID);
              //debug
            //   if(rawDataOperation.sql.indexOf('"name" ilike ') !== -1 && rawDataOperation.sql.indexOf("Organization") !== -1 && data.records.length === 0) {
            //     console.log(rawDataOperation.sql);
            //   }
            //   else if(rawDataOperation.sql.indexOf('"name" ilike ') !== -1 && rawDataOperation.sql.indexOf("Organization") !== -1 && data.records.length > 0){
            //       console.log("organization found by name");
            //   }
                var operation = new DataOperation();

                operation.objectDescriptor = readOperation.objectDescriptor;

                console.log("executed Statement err:",err, "data:",data);

              if (err) {
                // an error occurred
                console.log(err, err.stack, rawDataOperation); 
                operation.type = DataOperation.Type.ReadFailed;
                //Should the data be the error?
                operation.data = err;
                reject(operation);
              }
              else {
                // successful response
                operation.type = DataOperation.Type.ReadCompleted;
                //We provide the inserted record as the operation's payload
                operation.data = data.records;

                //Not needed anymore as we request data as json
                //operation._rawReadExpressionIndexMap = rawReadExpressionMap;

                resolve(operation);
              }  
            });

          });             
          //}
        }
    },

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
            objectDescriptor,
            operation = new DataOperation(),
            dataIdentifier = this.dataIdentifierForObject(object),
            objectDescriptor = this.objectDescriptorForObject(object),
            dataObjectChanges,
            changesIterator,
            operationData = {},
            mappingPromises,
            i, countI;

        operation.objectDescriptor = objectDescriptor;

        //When we have an operation to deal with, we'll know which it is.
        //Here we don't know if this record is a newly created object or one we fetched.  

        //We have a known dataIdentifier for this object, it's an Update Operation:
        if(dataIdentifier) {
            operation.type = DataOperation.Type.Update;
            //TEMPORARY, we need to send what changed only
            operation.criteria = Criteria.withExpression("identifier = $identifier", {"identifier":dataIdentifier});
            operation.data = operationData;

            dataObjectChanges = this.changesForDataObject(object);

            if(!dataObjectChanges) {
              //No changes to save for that object, we cancel.
              var createCancelledOperation = new DataOperation();
              createCancelledOperation.referrer = operation;
              createCancelledOperation.type = DataOperation.Type.CreateCancelled;

              //What else should we put on a CreateCancelled opration? A reason?

              return Promise.resolve(createCancelledOperation);
            }

            //Now that we got them, clear it so we don't conflict with further changes
            //if we have some async mapping stuff in-between
            this.clearRegisteredChangesForDataObject(object);

            changesIterator = dataObjectChanges.keys();
            while(aProperty = changesIterator.next().value) {
                aValue = dataObjectChanges.get(aProperty);
                aPropertyDescriptor = objectDescriptor.propertyDescriptorForName(aProperty);

                // if(aPropertyDescriptor.valueDescriptor) {
                //     console.log("It's an object, identifier is: ",this.dataIdentifierForObject(aValue));
                // }

                //A collection with "addedValues" / "removedValues" keys
                if(aValue.hasOwnProperty("addedValues") ||  aValue.hasOwnProperty("removedValues")) {
                    if(!(aPropertyDescriptor.cardinality>1)) {
                        throw new Error("added/removed values for property without a to-many cardinality");
                    }
                    //Until we get more sophisticated / use an expression mapping, we're
                    //going to turn objects into their identifer
                    addedValues = aValue.addedValues;
                    for(i=0, countI=addedValues.length;i<countI;i++) {
                        addedValues[i] = this.dataIdentifierForObject(addedValues[i]);
                    }
                    removedValues = aValue.removedValues;
                    for(i=0, countI=removedValues.length;i<countI;i++) {
                        removedValues[i] = this.dataIdentifierForObject(removedValues[i]);
                    }
                    //Here we mutated the structure from changesForDataObject. I should be cleared
                    //when saved, but what if save fails and changes happen in-between?
                    operation[aProperty] = aValue;
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

            if(Object.keys(operationData).length === 0 && !mappingPromises || mappingPromises.length === 0) {
              //console.log("NOTHING CHANGED TO SAVE");
              var saveCanceledOperation = new DataOperation();
              operation.type = DataOperation.Type.UpdateCanceled;
              operation.reason = "No Changes to save";
              return Promise.resolve(operation);
            }

            return (mappingPromises 
            ? Promise.all(mappingPromises)
            : Promise.resolve(true))
            .then(function(success) {
                //All mapping done and stored in operation.
                return new Promise(function(resolve,reject) {

                    self.handleUpdateOperation(operation) 
                    .then(function(rawUpdateCompletedOperation) {
                        var updateCompletedOperation = new DataOperation();
                        updateCompletedOperation.type = DataOperation.Type.UpdateCompleted;
                        updateCompletedOperation.data = object;
                        updateCompletedOperation.objectDescriptor = objectDescriptor;
                        resolve(updateCompletedOperation);
                    }, function(rawUpdateFailedOperation) {
                        var updateFailedOperation = new DataOperation();
                        updateFailedOperation.type = DataOperation.Type.UpdateFailed;
                        updateFailedOperation.data = object;
                        updateFailedOperation.objectDescriptor = objectDescriptor;

                        reject(updateFailedOperation);
                    });
                });
            },function(mappingError){
                console.error(mappingError);
            });
   
        } else {
          operation.type = DataOperation.Type.Create;
          operation.data = object

          return new Promise(function(resolve,reject) {

            //THIS NEEDS TO RETURN SOMETHING SUCCEED/FAIL
            //AND Regiter the new dataIdentifierForObject(object) so that from now-on. this.dataIdentifierForObject(object) returns it
            self.handleCreateOperation(operation)
            .then(function(createCompletedRawOperation) {
              //Record dataIdentifier for object
              var createCompletedOperation = new DataOperation(),
                    rawData = createCompletedRawOperation.data,
                    dataIdentifier = self.dataIdentifierForTypeRawData(createCompletedRawOperation.objectDescriptor,rawData);

              self.recordSnapshot(dataIdentifier, rawData);
              self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);

            //   var objectIdentifer =  self.dataIdentifierForObject(object);
            //   console.log("objectIdentifer: ",objectIdentifer," for newly inserted object: ",object);
              createCompletedOperation.referrer = operation;

              createCompletedOperation.type = DataOperation.Type.CreateCompleted;
              createCompletedOperation.data = object;
              resolve(createCompletedOperation);

            }, function(createFailedRawOperation) {
              //TODO needs a more dedicated type of error
              var createFailedOperation = new DataOperation();
              createFailedOperation.referrer = operation;
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
          objectDescriptor = this.objectDescriptorForObject;

        this.mapObjectDescriptorToRawOperation(objectDescriptor,rawDataOperation);

        //When we have an operation to deal with, we'll know which it is.
        //Here we don't know if this record is a newly created object or one we fetched
        if(this.dataIdentifierForObject(object)) {
          //Update Operation

          //Call
          phrontService.handleUpdateOperation(iOperation);

        } else {
          //Temporarary: Create a Raw Data operation that we should receive later.
          // var operation = new DataOperation();
          // operation.type = DataOperation.Type.Create;
          // operation.data = object

          //
          phrontService.handleCreateOperation(iOperation);

        }
        return this.nullPromise;
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
    value: function(propertyDescriptor) {
      var propertyDescriptorType = propertyDescriptor.valueType,
      //For backward compatibility, propertyDescriptor.valueDescriptor still returns a Promise....
      //propertyValueDescriptor = propertyDescriptor.valueDescriptor;
      //So until we fix this, tap into the private instance variable that contains what we want:
      propertyValueDescriptor = propertyDescriptor._valueDescriptorReference;

          if(propertyValueDescriptor) {
            if(propertyDescriptor.cardinality === 1) {
              return "uuid";
            }
            else {
              return "uuid[]";
            }
          }
          else {
            if(propertyDescriptor.cardinality === 1) {
              return this.mapPropertyDescriptorTypeToRawType(propertyDescriptorType);
            } else {
              //We have a cardinality of n. The propertyDescriptor.collectionValueType should tell us if it's a list or a map
              //But if we don't have a propertyValueDescriptor and propertyDescriptorType is an array, we don't know what
              //kind of type would be in the array...
              //We also don't know wether these objects should be stored inlined as JSONB for example. A valueDescriptor just
              //tells what structured object is expected as value in JS, not how it is stored. That is a SQL Mapping's job.
              //How much of expression data mapping could be leveraged for that?

              //If it's to-many and objets, we go for jsonb
              if(propertyDescriptorType === "object") {
                return "jsonb";
              }
              else return this.mapPropertyDescriptorTypeToRawType(propertyDescriptorType)+"[]";
            }

          }
    }
  },

  mapPropertyDescriptorTypeToRawType: {
      value: function(propertyDescriptorType) {
        if(propertyDescriptorType === "string" || propertyDescriptorType === "URL" ) {
          return "text";
        }
        //This needs moore informtion from a property descriptor regarding precision, sign, etc..
        else if(propertyDescriptorType === "number") {
          return "decimal";
        }
        else if(propertyDescriptorType === "boolean") {
          return "boolean";
        }
        else if(propertyDescriptorType === "date") {
          return "timestamp with time zone";//Defaults to UTC which is what we want
        }
        else if(propertyDescriptorType === "array" || propertyDescriptorType === "list") {
          //FIXME THIS IS WRONG and needs to be TENPORARY
          return "text[]";
        }
        else if(propertyDescriptorType === "object") {
          return "jsonb";
        }
        else {
          console.error("mapPropertyDescriptorTypeToRawType: unable to map "+propertyDescriptorType+" to RawType");
          return "text";
        }
      }
    },

    mapPropertyValueToRawType: {
        value: function(property, value, type) {
            if(value == null || value == "") {
                return "NULL";
            }
            else if(typeof value === "string") {
              return escapeString(value);
            }
            else {
              return prepareValue(value, type);
            }
        }
    },  
    mapPropertyValueToRawTypeExpression: {
      value: function(property, value, type) {
          var mappedValue = this.mapPropertyValueToRawType(property, value, type);
          // if(mappedValue !== "NULL" && (Array.isArray(value) || typeof value === "string")) {
          //   return `'${mappedValue}'`;
          // }
          return mappedValue;
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
    value: function(objectDescriptor) {
        //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
        return "postgres";
    }
  },

  schemaForObjectDescriptor: {
    value: function(objectDescriptor) {
        //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
        return "phront";
    }
  },

  tableForObjectDescriptor: {
    value: function(objectDescriptor) {
        //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
        return objectDescriptor.name;
    }
  },

  //We need a mapping to go from model(schema?)/ObjectDescriptor to schema/table
  mapObjectDescriptorToRawOperation: {
    value: function(objectDescriptor, rawDataOperation) {
        //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
        var databaseName = this.databaseForObjectDescriptor(objectDescriptor),
        //Hard coded for now, should be derived from a mapping telling us n which schemaName that objectDescriptor is stored
          schemaName = this.schemaForObjectDescriptor(objectDescriptor),

          dbAuthorization = this.authorizationForDatabaseInSchema(databaseName, schemaName);

        for(var key in dbAuthorization) {
          rawDataOperation[key] = dbAuthorization[key];
        }

        return rawDataOperation;
    }
  },

    //We need a mapping to go from model(schema?)/ObjectDescriptor to schema/table
   mapToRawCreateObjectDescriptorOperation: {
    value: function(dataOperation) {
        var objectDescriptor = dataOperation.data,
        mapping = objectDescriptor && this.mappingWithType(objectDescriptor),
        parentDescriptor,
        tableName = this.tableForObjectDescriptor(objectDescriptor),
        propertyDescriptors = Array.from(objectDescriptor.propertyDescriptors),
        i, countI, iPropertyDescriptor, iObjectRule, iRule,
        //Hard coded for now, should be derived from a mapping telling us n which databaseName that objectDescriptor is stored
        databaseName = "postgres",
        //Hard coded for now, should be derived from a mapping telling us n which schemaName that objectDescriptor is stored
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
        while((parentDescriptor)) {
          if(parentDescriptor.propertyDescriptors && propertyDescriptors.length) {
            propertyDescriptors.concat(parentDescriptor.propertyDescriptors);
          }
          parentDescriptor = parentDescriptor.parent;
        }



        for(i=propertyDescriptors.length-1;(i>-1);i--) {
            iPropertyDescriptor = propertyDescriptors[i];
            iObjectRule = mapping.objectMappingRules.get(iPropertyDescriptor.name);
            iRule = iObjectRule && mapping.rawDataMappingRules.get(iObjectRule.sourcePath);

            if(iRule) {
              columnName = iObjectRule.sourcePath;
            } else {
              columnName  = iPropertyDescriptor.name;
            }

            columnType = this.mapPropertyDescriptorToRawType(iPropertyDescriptor);
            columnSQL+= escapeIdentifier(columnName) + " "+columnType;

            if(columnType === 'text') {
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
            if(i>0) {
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

  /**
   * Handles the mapping and execution of a DataOperation to create.
   * an ObectDescriptor.
   *
   * @method
   * @argument {DataOperation} dataOperation - The dataOperation to execute
`  * @returns {Promise} - The Promise for the execution of the operation
   */
  handleCreateObjectDescriptorOperation: {
        value: function(createOperation) {
          var self = this,
              rawDataOperation = this.mapToRawCreateObjectDescriptorOperation(createOperation);
          //console.log("rawDataOperation: ",rawDataOperation);
          return new Promise(function(resolve,reject) {
            self.performCreateObjectDescriptorOperation(rawDataOperation,function(err, data) {
              var operation = new DataOperation();
              operation.objectDescriptor = createOperation.data;

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
                operation.data = operation.objectDescriptor;

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
    */

  /**
   * Handles the mapping and execution of a Create DataOperation.
   *
   * @method
   * @argument {DataOperation} dataOperation - The dataOperation to execute
`  * @returns {Promise} - The Promise for the execution of the operation
   */
    handleCreateOperation: {
        value: function(createOperation) {
            var data = createOperation.data;

            if(data instanceof ObjectDescriptor) {
                return this.handleCreateObjectDescriptorOperation(createOperation);
            } else {
              var rawDataOperation = {};

              //This adds the right access key, db name. etc... to the RawOperation.
              this.mapObjectDescriptorToRawOperation(createOperation.objectDescriptor,rawDataOperation);


              var self = this,
                  mappingPromise,
                  record = {};

              mappingPromise =  this._mapObjectToRawData(data, record);
              if (!mappingPromise) {
                  mappingPromise = this.nullPromise;
              }
              return mappingPromise.then(function () {

                record.id = uuid.generate();

                var tableName = self.tableForObjectDescriptor(createOperation.objectDescriptor),
                    schemaName = rawDataOperation.schema,
                    recordKeys = Object.keys(record),
                    escapedRecordKeys = recordKeys.map(key => escapeIdentifier(key)),
                    recordKeysValues = Array(recordKeys.length),
                    sqlColumns = recordKeys.join(","),
                    i, countI, iValue, iMappedValue,
                    sql;


                for(i=0, countI=recordKeys.length;i<countI;i++) {
                  iValue = record[recordKeys[i]];
                  iMappedValue = self.mapPropertyValueToRawTypeExpression(recordKeys[i],iValue);
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

                sql = `INSERT INTO ${schemaName}."${tableName}" (${escapedRecordKeys.join(",")})
                            VALUES (${recordKeysValues.join(",")})`;

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
                rawDataOperation.sql = sql;
                //console.log(sql);
                return new Promise(function(resolve,reject) {
                  self._executeStatement(rawDataOperation, function(err, data) {
                    var operation = new DataOperation();
                    operation.objectDescriptor = createOperation.objectDescriptor;
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
                      operation.type = DataOperation.Type.CreateCompleted;
                      //We provide the inserted record as the operation's payload
                      operation.data = record;

                      resolve(operation);
                    }  
                  });

                });              
            });
        }
      }
    },
    handleUpdateOperation: {
      value: function(updateOperation) {
        var data = updateOperation.data;

        if(data instanceof ObjectDescriptor) {
          return this.handleUpdateObjectDescriptorOperation(updateOperation);
        } else {
            var rawDataOperation = {},
                criteria = updateOperation.criteria,
                dataChanges = data,
                changesIterator,
                objectDescriptor = updateOperation.objectDescriptor,
                aProperty, aValue, addedValues, removedValues, aPropertyDescriptor,
                record = {};

            //This adds the right access key, db name. etc... to the RawOperation.
            this.mapObjectDescriptorToRawOperation(data.objectDescriptor,rawDataOperation);


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


            //Now we need to transform the operation into SQL:
            var tableName = this.tableForObjectDescriptor(objectDescriptor),
            schemaName = rawDataOperation.schema,
            recordKeys = Object.keys(dataChanges),
            setRecordKeys = Array(recordKeys.length),
            sqlColumns = recordKeys.join(","),
            i, countI, iKey, iKeyEscaped, iValue, iMappedValue, iAssignment, iPrimaryKey, iPrimaryKeyValue,
            iKeyValue,
            condition,
            sql,
            self = this;


            //We need to transform the criteria into a SQL equivalent. Hard-coded for a single object for now
            if(Object.keys(criteria.parameters).length === 1 && criteria.parameters.hasOwnProperty("identifier")) {
                condition = `id = '${criteria.parameters.identifier.primaryKey}'::uuid`;
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

            for(i=0, countI=recordKeys.length;i<countI;i++) {
                iKey = recordKeys[i];
                iKeyEscaped = escapeIdentifier(iKey);
                iValue = dataChanges[iKey];
                if(iValue.hasOwnProperty("addedValues")) {
                    iMappedValue = this.mapPropertyValueToRawTypeExpression(iKey,iValue.addedValues);
                    iAssignment = `${iKeyEscaped} = array_append(${iKeyEscaped}, ${iMappedValue})`;
                } 
                if(iValue.hasOwnProperty("removedValues")) {
                  iMappedValue = this.mapPropertyValueToRawTypeExpression(iKey,iValue.removedValues);
                  iAssignment = `${iKeyEscaped} = array_remove(${iKeyEscaped}, ${iMappedValue})`;
                } else if(iValue === null) {
                    iAssignment = `${iKeyEscaped} = NULL`;
                } else {
                    iMappedValue = this.mapPropertyValueToRawTypeExpression(iKey,iValue);
                    //iAssignment = `${iKey} = '${iValue}'`;
                    iAssignment = `${iKeyEscaped} = ${iMappedValue}`;
                }
                setRecordKeys[i] = iAssignment;
            }

            if(!setRecordKeys || setRecordKeys.length === 0) {
              var operation = new DataOperation();
              operation.type = DataOperation.Type.UpdateCanceled;
              operation.reason = "No update provided";

              return Promise.resolve(operation);
            }


            sql = `UPDATE  ${schemaName}."${tableName}" SET ${setRecordKeys.join(",")} 
            WHERE (${condition})`;

            rawDataOperation.sql = sql;
            //console.log(sql);
            return new Promise(function(resolve,reject) {
              self._executeStatement(rawDataOperation, function(err, data) {
                var operation = new DataOperation();
                operation.objectDescriptor = objectDescriptor;
                if (err) {
                  // an error occurred
                  console.log(err, err.stack, rawDataOperation); 
                  operation.type = DataOperation.Type.UpdateFailed;
                  //Should the data be the error?
                  operation.data = err;
                  reject(operation);
                }
                else {
                  // successful response
                  operation.type = DataOperation.Type.UpdateCompleted;
                  //We provide the inserted record as the operation's payload
                  operation.data = record;

                  resolve(operation);
                }  
              });

            });             
        
        }
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
      }    
    }

});
