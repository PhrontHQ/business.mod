var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    Criteria = require("montage/core/criteria").Criteria,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    DataQuery = require("montage/data/model/data-query").DataQuery,
    DataStream = require("montage/data/service/data-stream").DataStream,
    Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    DataOrdering = require("montage/data/model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("montage/frb/evaluate"),
    Set = require("montage/collections/set"),
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    uuid = require("montage/core/uuid"),
    WebSocket = require("montage/core/web-socket").WebSocket,
    PhrontClientService;



    /**
* TODO: Document
*
* @class
* @extends RawDataService
*/
exports.PhrontClientService = PhrontClientService = RawDataService.specialize(/** @lends PhrontClientService.prototype */ {
    constructor: {
        value: function PhrontClientService() {
            var self = this;

            this.super();

            if( typeof WebSocket !== "undefined") {
                this._socket = new WebSocket("wss://77mq8uupuc.execute-api.us-west-2.amazonaws.com/dev");

                this._socket.addEventListener("open", this);
                this._socket.addEventListener("error", this);
                this._socket.addEventListener("close", this);
                this._socket.addEventListener("message", this);    
            }


            this._thenableByOperationId = new Map();
            this._pendingOperationById = new Map();

            this._socketOpenPromise = new Promise(function(resolve, reject) {
                self._socketOpenPromiseResolve = resolve;
                self._socketOpenPromiseReject = reject;
            });

            this._serializer = new MontageSerializer().initWithRequire(require);
            this._deserializer = new Deserializer();

            return this;
        }
    },

    // authorizationServices: {
    //     value: ["data/main.datareel/service/cognito-authorization-service"]
    // },

    // authorizationManagerWillAuthorizeWithServices: {
    //     value: function (authorizationManager, authorizationServices) {
    //         console.log("authorizationManagerWillAuthorizeWithService:",authorizationManager,authorizationService);
    //         // authorizationService.connectionDescriptor = this.authorizationDescriptor;
    //     }
    // },

    _authorizationPolicy: {
        value: undefined
    },

    authorizationPolicy: {
        get: function() {
            return this._authorizationPolicy
        },
        set: function(value) {
            this._authorizationPolicy = value;
        }
    },

    handleOpen: {
        value: function (event) {
            console.log("WebSocket opened");
            this._socketOpenPromiseResolve(true);
            //this._socket.send("Echo....");
            //this.dispatchEvent(event, true, false);
        }
    },

    handleError: {
        value: function (event) {
            console.error("WebSocket error:", event);
        }
    },

    handleMessage: {
        value: function (event) {
            var serializedOperation;
            //console.log("received socket message ",event);
                serializedOperation = event.data;
                //console.log("<---- receive operation "+serializedOperation);


            if(serializedOperation) {
                var deserializedOperation,
                operation,
                objectRequires,
                module,
                isSync = true;

                try {
                    this._deserializer.init(serializedOperation, require, objectRequires, module, isSync);
                    operation = this._deserializer.deserializeObject();
                } catch (e) {
                    return console.error("Invalid Operation Serialization:", event.data);
                }

                if(operation) {
                    var type = operation.type,
                        operationListenerMethod = this._operationListenerNameForType(type);
                        
                    if(typeof this[operationListenerMethod] !== "function") {
                        console.error("Implementation for "+operationListenerMethod+" is missing");
                    }
                    else {
                        this[operationListenerMethod](operation);
                    }
                }
  
            }
  

            // event.detail = parsed;
            // this.dispatchEvent(event, true, false);
        }
    },

    _operationListenerNamesByType: {
        value: new Map()
    },   
    _operationListenerNameForType: {
        value: function(type) {
            return this._operationListenerNamesByType.get(type) || this._operationListenerNamesByType.set(type,"handle"+type.toCapitalized()).get(type);
        }
    },

    handleReadupdate: {
        value: function (operation) {
            var referrer = operation.referrerId,
            records = operation.data,
            stream = this._thenableByOperationId.get(referrer);

            if(records && records.length > 0) {

                //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
                this.addRawData(stream, records);   
                this.rawDataDone(stream);    
            }    

        }
    },

    handleReadcompleted: {
        value: function (operation) {
            this.handleReadupdate(operation);
        }
    },

    handleCreatecompleted: {
        value: function (operation) {
            var referrerOperation = this._pendingOperationById.get(operation.referrerId);

            /*
                After creation we need to do this:                   self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);       
                
                The referrerOperation could get hold of object, but it doesn't right now.
                We could also create a uuid client side and not have to do that and deal wih it all in here which might be cleaner.

                Now resolving the promise finishes the job in saveObjectData that has the object in scope.
            */
            referrerOperation._promiseResolve(operation);
        }
    },

    handleUpdatecompleted: {
        value: function (operation) {
            var referrerOperation = this._pendingOperationById.get(operation.referrerId);

            /*
                After creation we need to do this:                   self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);       
                
                The referrerOperation could get hold of object, but it doesn't right now.
                We could also create a uuid client side and not have to do that and deal wih it all in here which might be cleaner.

                Now resolving the promise finishes the job in saveObjectData that has the object in scope.
            */
            referrerOperation._promiseResolve(operation);
        }
    },


    handleClose: {
        value: function () {
            console.log("WebSocket closed");
            this._failedConnections++;
            if (this._failedConnections > 5) {
                // The token we're trying to use is probably invalid, force
                // sign in again
                window.location.reload();
            }
            //this._stopHeartbeat();
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

    _dispatchReadOperation: {
        value: function(operation, stream) {
            this._thenableByOperationId.set(operation.id, stream);
            this._dispatchOperation(operation);
        }
    },
    _dispatchOperation: {
        value: function(operation) {
            this._pendingOperationById.set(operation.id, operation);
            var serializedOperation = this._serializer.serializeObject(operation);
            //console.log("----> send operation "+serializedOperation);
            this._socket.send(serializedOperation);
        }
    },

    rawCriteriaForObject: {
        value: function(object, _objectDescriptor) {
            if(object.identifier) {
                var objectDescriptor = _objectDescriptor || this.objectDescriptorForObject(object),
                mapping = this.mappingWithType(objectDescriptor),
                //TODO: properly respect and implement up using what's in rawDataPrimaryKeys
                //rawDataPrimaryKeys = mapping ? mapping.rawDataPrimaryKeyExpressions : null,
                objectCriteria;

                objectCriteria = new Criteria().initWithExpression("id == $id", {id: object.identifier.primaryKey});
                return objectCriteria;
            } else {
                //It's a new object and we don't have a uuid?, we can't create a criteria for it
                return null;
            }
        }
    },

    criteriaForObject: {
        value: function(object) {
            var dataIdentifier = this.dataIdentifierForObject(object);

            if(dataIdentifier) {
                return Criteria.withExpression("identifier = $identifier", {"identifier":dataIdentifier});
            } else {
                //It's a new object and we don't have a uuid?, we can't create a criteria for it
                return null;
            }
        }
    },


    fetchObjectProperty: {
        value: function (object, propertyName) {
            var objectDescriptor = this.objectDescriptorForObject(object),
                propertyNameQuery = DataQuery.withTypeAndCriteria(objectDescriptor,this.rawCriteriaForObject(object, objectDescriptor));

            propertyNameQuery.prefetchExpressions = [propertyName];

            return this.fetchData(propertyNameQuery);
        }
    },

    //This probably isn't right and should be fetchRawData, but switching creates a strange error.
    fetchData: {
        value: function (query, stream) {
            var self = this;
            stream = stream || new DataStream();
            stream.query = query;

            this._socketOpenPromise.then(function() {
                var objectDescriptor = query.type,
                readOperation = new DataOperation(),
                serializedOperation;
    
              //We need to turn this into a Read Operation. Difficulty is to turn the query's criteria into
              //one that doesn't rely on objects. What we need to do before handing an operation over to another context
              //bieng a worker on the client side or a worker on the server side, is to remove references to live objects.
              //One way to do this is to replace every object in a criteria's parameters by it's data identifier.
              //Another is to serialize the criteria.
              readOperation.type = DataOperation.Type.Read;
              readOperation.dataDescriptor = objectDescriptor.module.id;  
              readOperation.criteria = query.criteria;
              readOperation.objectExpressions = query.prefetchExpressions;
  
                self._dispatchReadOperation(readOperation, stream);
            });
  
          return stream;
        }
    },

    _processObjectChangesForProperty: {
        value: function(object, aProperty, aPropertyDescriptor, aRawProperty, aPropertyChanges, operationData, snapshot, dataSnapshot) {
            var self = this
                aPropertyDeleteRule = aPropertyDescriptor.deleteRule;
            // if(aPropertyDescriptor.valueDescriptor) {
            //     console.log("It's an object, identifier is: ",this.dataIdentifierForObject(aValue));
            // }

            //A collection with "addedValues" / "removedValues" keys
            if(aPropertyChanges && (aPropertyChanges.hasOwnProperty("addedValues") ||  aPropertyChanges.hasOwnProperty("removedValues"))) {
                if(!(aPropertyDescriptor.cardinality>1)) {
                    throw new Error("added/removed values for property without a to-many cardinality");
                }
                /*
                    Until we get more sophisticated and we can leverage
                    the full serialization, we turn objects into their primaryKey

                    We have a partial view, the backend will need pay attention that we're not re-adding object if it's already there, and should be unique.
                */
                addedValues = aPropertyChanges.addedValues;
                for(i=0, countI=addedValues.length;i<countI;i++) {
                    iValue = addedValues[i];
                    addedValues[i] = this.dataIdentifierForObject(iValue).primaryKey;
                }

                removedValues = aPropertyChanges.removedValues;
                for(i=0, countI=removedValues.length;i<countI;i++) {
                    iValue = removedValues[i];
                    removedValues[i] = this.dataIdentifierForObject(iValue).primaryKey;
                }

                //Here we mutated the structure from changesForDataObject. I should be cleared
                //when saved, but what if save fails and changes happen in-between?

                operationData[aRawProperty] = aPropertyChanges;
            }
            else {
                result = this._mapObjectPropertyToRawData(object, aProperty, operationData);

                /*
                    we need to check post mapping that the rawValue is different from the snapshot
                */
                if (this._isAsync(result)) {
                    return result.then(function () {
                        self._setOperationDataSnapshotForProperty(operationData, snapshot, dataSnapshot, aRawProperty );
                    });
                }
                else {
                    self._setOperationDataSnapshotForProperty(operationData, snapshot, dataSnapshot, aRawProperty );
                }
            }
        }
    },

    _setOperationDataSnapshotForProperty: {
        value: function(operationData, snapshot, dataSnapshot, aRawProperty ) {
            if(snapshot.hasOwnProperty(aRawProperty)) {
                if(snapshot[aRawProperty] === operationData[aRawProperty]) {
                    delete operationData[aRawProperty];
                    delete snapshot[aRawProperty];
                }
                else {
                    dataSnapshot[aRawProperty] = snapshot[aRawProperty];
                }
            } 

        }
    },

    primaryKeyForNewDataObject: {
        value: function (type) {
            return uuid.generate();
        }
    },

    saveDataOperationFoObject: {
        value: function (object, operationType) {
            try {

                //TODO
                //First thing we should be doing here is run validation
                //on the object, which should be done one level up
                //by the mainService. Do there and test
    
                /*
                    Here we want to use:
                    this.rootService.changesForDataObject();
    
                    to only map back, and send, only:
                    1. what was changed by the user, and
                    2. that is different from the snapshot?
    
                */
    
                var self = this,
                    operation = new DataOperation(),
                    dataIdentifier = this.dataIdentifierForObject(object),
                    objectDescriptor = this.objectDescriptorForObject(object),
                    mapping = this.mappingWithType(objectDescriptor),
                    //We make a shallow copy so we can remove properties we don't care about
                    snapshot = Object.assign({},object.identifier && this.snapshotForDataIdentifier(object.identifier)),
                    dataSnapshot = {},
                    snapshotValue,
                    dataObjectChanges = this.rootService.changesForDataObject(object),
                    changesIterator,
                    aProperty, aRawProperty,
                    isNewObject = self.rootService.createdDataObjects.has(object),
                    operationData = {},
                    mappingPromise,
                    mappingPromises,
                    i, iValue, countI;
    
                operation.target = operation.dataDescriptor = objectDescriptor.module.id;
    
                operation.type = operationType 
                    ? operationType
                    : isNewObject 
                        ? DataOperation.Type.Create 
                        : DataOperation.Type.Update;
    
                if(dataIdentifier) {
                    if(!isNewObject) {
                        operation.criteria = this.rawCriteriaForObject(object, objectDescriptor);
                    }
                    else {
                        operationData.id = dataIdentifier.primaryKey;
                    }
                }
    
                //Nothing to do, change the operatio type and bail out
                if(!isNewObject && !dataObjectChanges) {
                    operation.type = DataOperation.Type.NoOp;
                    return Promise.resolve(operation);
                }
    
                operation.data = operationData;
    
                // if(isNewObject) {
                //     mappingPromise =  this._mapObjectToRawData(object, operationData);
                // } else {
    
                    /*
                        The last fetched values of the properties that changed, so the backend can use it to make optimistic-locking update
                        with a where that conditions that the current value is still
                        the one that was last fecthed by the client making the update.
                    */
                    if(!isNewObject) {
                        operation.snapshot = dataSnapshot;
                    }
    
                    changesIterator = dataObjectChanges.keys();
                    while(aProperty = changesIterator.next().value) {
                        aRawProperty = mapping.mapObjectPropertyNameToRawPropertyName(aProperty);
                        snapshotValue = snapshot[aRawProperty];
                        aPropertyChanges = dataObjectChanges.get(aProperty);
                        aPropertyDescriptor = objectDescriptor.propertyDescriptorForName(aProperty);
    
                        result = this._processObjectChangesForProperty(object, aProperty, aPropertyDescriptor, aRawProperty, aPropertyChanges, operationData, snapshot, dataSnapshot);
    
                        if(result && this._isAsync(result)) {
                            (mappingPromises || (mappingPromises = [])).push(result);
                        }
                    }
    
                    if(mappingPromises && mappingPromises.length) {
                        mappingPromise = Promise.all(mappingPromises);
                    }
                //}
    
    
                return (mappingPromise 
                    ? mappingPromise
                    : Promise.resolve(true))
                    .then(function(success) {
    
                        if(Object.keys(operationData).length === 0) {
                            //if there are no changes known, it's a no-op: if it's an existing object,
                            //nothing to do and if it's a new empty object... should it go through??
                            //Or it's either a CreateCancelled or an UpdateCancelled
                            operation.type = DataOperation.Type.NoOp;
                        }
                        else {
                            /*
                                Now that we got them, clear it so we don't conflict with further changes if we have some async mapping stuff in-between.
            
                                If somehow things fail, we have the pending operation at hand to re-try
                            */
                            self.clearRegisteredChangesForDataObject(object);
                        }
                        return operation;            
                    }); 
            }
            catch(error) {
                return Promise.reject(error);
            }
        }
    },
    /**
     * Save changes made to a data object. At this level, this can become either a create operation
     * if object is new, or an update operation if it was fetched.
     *
     * @method
     * @argument {Object} object - The object whose data should be saved.
     * @returns {external:Promise} - A promise fulfilled when all of the data in
     * the changed object has been saved.
     * 
     */
    saveDataObject: {
        value: function (object) {

            try {

            //TODO
            //First thing we should be doing here is run validation
            //on the object, which should be done one level up
            //by the mainService. Do there and test

            /*
                Here we want to use:
                this.rootService.changesForDataObject();

                to only map back, and send, only:
                1. what was changed by the user, and
                2. that is different from the snapshot?

            */

                var self = this;
                    // mapping = this.mappingWithType(objectDescriptor),
                    // //We make a shallow copy so we can remove properties we don't care about
                    // snapshot = Object.assign({},object.identifier && this.snapshotForDataIdentifier(object.identifier)),
                    // dataSnapshot = {},
                    // snapshotValue,
                    // dataObjectChanges = this.rootService.changesForDataObject(object),
                    // changesIterator,
                    // aProperty, aRawProperty,
                    // isNewObject = self.rootService.createdDataObjects.has(object),
                    // operationData = {},
                    // mappingPromise,
                    // mappingPromises,
                    // i, iValue, countI;



                return this.saveDataOperationFoObject(object).then(function(operation) {

                    if(operation.type === DataOperation.Type.NoOp) {
                        //if there are no changes known, it's a no-op: if it's an existing object,
                        //nothing to do and if it's a new empty object... should it go through??
                        //Or it's either a CreateCancelled or an UpdateCancelled
                        return Promise.resolve(operation);            
                    }
                    else {
                        return self._socketOpenPromise.then(function () {
        
                            operationPromise = new Promise(function(resolve, reject) {
                                operation._promiseResolve = resolve;
                                operation._promiseReject = reject;
                            });
                            self._thenableByOperationId.set(operation.id,operationPromise);
            
                            /*
                                would it be useful to pass the snapshot raw data as well?
                                // -> great question, yes, because it will help the SQL generation to add a where clause for the previous value, so that if it changed since, then the update will fail, and we can communicate that back to the user.
                                
                                to eventually push updates if any it will be better done by a push when something changes, and for that, we'd need to have in the backend a storage/record: 
                                    identifier -> list of clients who have it.

                                When a client stops to run, unless it supports push notifications and service worker, we could tell the backend
                                so it can remove it from the list of clients.

                                Similarly, if a client supports ServiceWorker, the clientId should one from the service worker, which is shared by all tabs and might run in the background. On browsers that don't, all the stack will run in main thread and 2 tabs should behave as 2 different clients.
                            */


                            self._dispatchOperation(operation); 
                            
                            return operationPromise;
                            // this is sync
                            // cool, but how do we know that the write operation has been carried out?
                            // the other side of the socket _should_ send us a DataOperation of type createcomplete/updatecomplete
                            // or createfailed/updatefailed, which will pass through our `handleMessage`
                            // maybe we should create a dummy DataStream and record it in this._thenableByOperationId,
                            // so that we can wait for the stream to be rawDataDone before we resolve this saveRawData promise?
                            // or we need some other mechanism of knowing that the complete or failed operation came through
                            // and maybe we should time out if it takes too long?
                        })
                        .then(function(operation) {
                            //rawData contains the id, in case it was generated
                            //by the database
                            var  referrerOperation = self._pendingOperationById.get(operation.referrerId),
                                dataIdentifier = self.dataIdentifierForObject(object),
                                objectDescriptor = self.objectDescriptorForObject(object),
                                rawData, snapshot = {};
        
        
                            if(operation.type === DataOperation.Type.CreateCompleted) {
                                rawData = operation.data,
                                objectDescriptor = self.objectDescriptorWithModuleId(operation.dataDescriptor),
                                dataIdentifier = self.dataIdentifierForTypeRawData(objectDescriptor,rawData);
            
                                //First set what we sent
                                Object.assign(snapshot,referrerOperation.data);
                                //then set what we received
                                Object.assign(snapshot,rawData);
                                self.recordSnapshot(dataIdentifier, snapshot);
                                self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);        
                            }
                            else if(operation.type === DataOperation.Type.UpdateCompleted) {
                                // referrerOperation = self._pendingOperationById.get(operation.referrerId);
                                var dataIdentifier = self.dataIdentifierForObject(object);
                                self.recordSnapshot(dataIdentifier, referrerOperation.data);
                            }
                            else {
                                console.error("operation not handled properly",operation);
                            }
                            return operation;
                        });
                    }

                });

            }
            catch(error) {
                return Promise.reject(error);
            }
        }
    },

    // saveDataObject: {
    //     value: function (object) {

    //         try {

    //         //TODO
    //         //First thing we should be doing here is run validation
    //         //on the object, which should be done one level up
    //         //by the mainService. Do there and test

    //         /*
    //             Here we want to use:
    //             this.rootService.changesForDataObject();

    //             to only map back, and send, only:
    //             1. what was changed by the user, and
    //             2. that is different from the snapshot?

    //         */

    //         var self = this,
    //             operation = new DataOperation(),
    //             dataIdentifier = this.dataIdentifierForObject(object),
    //             objectDescriptor = this.objectDescriptorForObject(object),
    //             mapping = this.mappingWithType(objectDescriptor),
    //             //We make a shallow copy so we can remove properties we don't care about
    //             snapshot = Object.assign({},object.identifier && this.snapshotForDataIdentifier(object.identifier)),
    //             dataSnapshot = {},
    //             snapshotValue,
    //             dataObjectChanges = this.rootService.changesForDataObject(object),
    //             changesIterator,
    //             aProperty, aRawProperty,
    //             isNewObject = self.rootService.createdDataObjects.has(object),
    //             operationData = {},
    //             mappingPromise,
    //             mappingPromises,
    //             i, iValue, countI;

    //         operation.target = operation.dataDescriptor = objectDescriptor.module.id;

    //         operation.type = isNewObject ? DataOperation.Type.Create : DataOperation.Type.Update;

    //         if(dataIdentifier) {
    //             operation.criteria = this.rawCriteriaForObject(object, objectDescriptor);
    //         }

    //         //Nothing to do, change the operatio type and bail out
    //         if(!isNewObject && !dataObjectChanges) {
    //             operation.type = DataOperation.Type.NoOp;
    //             return Promise.resolve(operation);
    //         }

    //         operation.data = operationData;

    //         if(isNewObject) {
    //             mappingPromise =  this._mapObjectToRawData(object, operationData);
    //         } else {

    //             /*
    //                 The last fetched values of the properties that changed, so the backend can use it to make optimistic-locking update
    //                 with a where that conditions that the current value is still
    //                 the one that was last fecthed by the client making the update.
    //             */
    //             operation.snapshot = dataSnapshot;

    //             /*
    //                 Now that we got them, clear it so we don't conflict with further changes if we have some async mapping stuff in-between.

    //                 If somehow things fail, we have the pending operation at hand to re-try
    //             */
    //             this.clearRegisteredChangesForDataObject(object);

    //             changesIterator = dataObjectChanges.keys();
    //             while(aProperty = changesIterator.next().value) {
    //                 aRawProperty = mapping.mapObjectPropertyNameToRawPropertyName(aProperty);
    //                 snapshotValue = snapshot[aRawProperty];
    //                 aPropertyChanges = dataObjectChanges.get(aProperty);
    //                 aPropertyDescriptor = objectDescriptor.propertyDescriptorForName(aProperty);

    //                 result = this._processObjectChangesForProperty(object, aProperty, aPropertyDescriptor, aRawProperty, aPropertyChanges, operationData, snapshot, dataSnapshot);

    //                 if(result && this._isAsync(result)) {
    //                     (mappingPromises || (mappingPromises = [])).push(result);
    //                 }
    //             }

    //             if(mappingPromises && mappingPromises.length) {
    //                 mappingPromise = Promise.all(mappingPromises);
    //             }
    //         }


    //         return (mappingPromise 
    //             ? mappingPromise
    //             : Promise.resolve(true))
    //             .then(function(success) {

    //                 if(Object.keys(operationData).length > 0) {
    //                     return self._socketOpenPromise.then(function () {
    
    //                         operationPromise = new Promise(function(resolve, reject) {
    //                             operation._promiseResolve = resolve;
    //                             operation._promiseReject = reject;
    //                         });
    //                         self._thenableByOperationId.set(operation.id,operationPromise);
            
    //                         /*
    //                              would it be useful to pass the snapshot raw data as well?
    //                             // -> great question, yes, because it will help the SQL generation to add a where clause for the previous value, so that if it changed since, then the update will fail, and we can communicate that back to the user.
                                
    //                             to eventually push updates if any it will be better done by a push when something changes, and for that, we'd need to have in the backend a storage/record: 
    //                                 identifier -> list of clients who have it.
    
    //                             When a client stops to run, unless it supports push notifications and service worker, we could tell the backend
    //                             so it can remove it from the list of clients.
    
    //                             Similarly, if a client supports ServiceWorker, the clientId should one from the service worker, which is shared by all tabs and might run in the background. On browsers that don't, all the stack will run in main thread and 2 tabs should behave as 2 different clients.
    //                         */
    
    
    //                         self._dispatchOperation(operation); 
                            
    //                         return operationPromise;
    //                         // this is sync
    //                         // cool, but how do we know that the write operation has been carried out?
    //                         // the other side of the socket _should_ send us a DataOperation of type createcomplete/updatecomplete
    //                         // or createfailed/updatefailed, which will pass through our `handleMessage`
    //                         // maybe we should create a dummy DataStream and record it in this._thenableByOperationId,
    //                         // so that we can wait for the stream to be rawDataDone before we resolve this saveRawData promise?
    //                         // or we need some other mechanism of knowing that the complete or failed operation came through
    //                         // and maybe we should time out if it takes too long?
    //                     });
    //                 }
    //                 else {
    //                     //if there are no changes known, it's a no-op: if it's an existing object,
    //                     //nothing to do and if it's a new empty object... should it go through??
    //                     //Or it's either a CreateCancelled or an UpdateCancelled
    //                     operation.type = DataOperation.Type.NoOp;
    //                     return Promise.resolve(operation);            
    //                 }    

    //             })
    //             .then(function(operation) {
    //                 //rawData contains the id, in case it was generated
    //                 //by the database

    //                 if(operation.type === DataOperation.Type.CreateCompleted) {
    //                     var rawData = operation.data,
    //                     objectDescriptor = self.objectDescriptorWithModuleId(operation.dataDescriptor),
    //                     dataIdentifier = self.dataIdentifierForTypeRawData(objectDescriptor,rawData);
    
    //                     self.recordSnapshot(dataIdentifier, operationData);
    //                     self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);        
    //                 }
    //                 else if(operation.type === DataOperation.Type.UpdateCompleted) {
    //                     // referrerOperation = self._pendingOperationById.get(operation.referrerId);
    //                     var dataIdentifier = self.dataIdentifierForObject(object);
    //                     self.recordSnapshot(dataIdentifier, operationData);
    //                 }
    //                 return operation;
    //             });

    //         }
    //         catch(error) {
    //             return Promise.reject(error);
    //         }
    //     }
    // },


    _rawDataUpdatesFromObjectSnapshot: {
        value: function(rawData, snapshot) {
            var keys = Object.keys(rawData),
                i, countI, iKey, iKeyValue,
                iSnapshotValue, changedSnapshot;

            for(i=0, countI = keys[i],keys.length;(i<countI);i++) {
                iKey = keys[i];
                if(snapshot.hasOwnProperty(iKey) && snapshot[iKey] === rawData[iKey]) {
                    delete rawData[iKey];
                }
                else {
                    changedSnapshot = changedSnapshot || {};
                    changedSnapshot[iKey] = snapshot[iKey];
                }
            }
            return {
                changes: rawData,
                snapshot: changedSnapshot
            };
        }
    },

    rawDataUpdatesFromObjectSnapshot: {
        value: function(rawData, object) {
            var snapshot = object.identifier && this.snapshotForDataIdentifier(object.identifier);

            return snapshot 
                ? this._rawDataUpdatesFromObjectSnapshot(rawData,snapshot)
                : {changes: rawData, snapshot: null};
        }
    },

    // saveRawData: {
    //     value: function (record, object) {
    //         try {
    //             var self = this,
    //                 updates = this.rawDataUpdatesFromObjectSnapshot(record, object),
    //                 snapshot = this.snapshotForDataIdentifier(object.identifier),
    //                 isNewObject = self.rootService.createdDataObjects.has(object),
    //                 objectDescriptor = this.objectDescriptorForObject(object);

    //             if(Object.keys(updates.changes).length > 0) {
    //                 return this._socketOpenPromise.then(function () {

    //                     var saveOperation = new DataOperation(),
    //                     saveOperationPromise = new Promise(function(resolve, reject) {
    //                         saveOperation._promiseResolve = resolve;
    //                         saveOperation._promiseReject = reject;
    //                     });
    //                     this._thenableByOperationId.set(saveOperation.id,saveOperationPromise);

    //                     saveOperation.type = isNewObject ? DataOperation.Type.Create : DataOperation.Type.Update;

    //                     saveOperation.target = saveOperation.dataDescriptor = objectDescriptor.module.id;
    //                     saveOperation.criteria = this.rawCriteriaForObject(object, objectDescriptor);
    //                     /*
    //                         Contains the key / value changes, when key is a toMany, value is like:
    //                         {
    //                             addedValues: [],
    //                             removedValues: []
    //                         }
    //                     */
    //                     saveOperation.data = updates.changes;

    //                     /*
    //                         The last fetched values of the properties that changed
    //                     */
    //                     saveOperation.snapshot = updates.snapshot;
    //                     /*
    //                          would it be useful to pass the snapshot raw data as well?
    //                         // -> great question, yes, because it will help the SQL generation to add a where clause for the previous value, so that if it changed since, then the update will fail, and we can communicate that back to the user.
                            
    //                         to eventually push updates if any it will be better done by a push when something changes, and for that, we'd need to have in the backend a storage/record: 
    //                             identifier -> list of clients who have it.

    //                         When a client stops to run, unless it supports push notifications and service worker, we could tell the backend
    //                         so it can remove it from the list of clients.

    //                         Similarly, if a client supports ServiceWorker, the clientId should one from the service worker, which is shared by all tabs and might run in the background. On browsers that don't, all the stack will run in main thread and 2 tabs should behave as 2 different clients.
    //                     */


    //                     self._dispatchOperation(saveOperation); // this is sync
    //                     // cool, but how do we know that the write operation has been carried out?
    //                     // the other side of the socket _should_ send us a DataOperation of type createcomplete/updatecomplete
    //                     // or createfailed/updatefailed, which will pass through our `handleMessage`
    //                     // maybe we should create a dummy DataStream and record it in this._thenableByOperationId,
    //                     // so that we can wait for the stream to be rawDataDone before we resolve this saveRawData promise?
    //                     // or we need some other mechanism of knowing that the complete or failed operation came through
    //                     // and maybe we should time out if it takes too long?
    //                 });
    //             }
    //             else {
    //                 //if there are no changes known, it's a no-op: if it's an existing object,
    //                 //nothing to do and if it's a new empty object... should it go through??
    //                 //Or it's either a CreateCancelled or an UpdateCancelled
    //                 var noopOperation = new DataOperation();
    //                 noopOperation.type = DataOperation.Type.NoOp;
    //                 noopOperation.target = objectDescriptor;
    //                 noopOperation.dataDescriptor = objectDescriptor.module.id;
    //                 noopOperation.criteria = this.rawCriteriaForObject(object, objectDescriptor);

    //                 return Promise.resolve(noopOperation);

    //             }
    //         }
    //         catch(error) {
    //             return Promise.reject(error);
    //         }
    //     }
    // },
    handleCreatefailed: {
        value: function (operation) {
            var referrerOperation = this._pendingOperationById.get(operation.referrerId),
            records = operation.data;

            if(records && records.length > 0) {

                //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
                this.addRawData(stream, records);
                this.rawDataDone(stream);
            }

        }
    },

    /* overriden to be a no-op, and was only used for by deleteObject */
    _updateDataObject: {
        value: function (object, action) {
        }
    },

    /**
     * Overrides DataService's that flags the object as deleted 
     * so we don't do more. saveChanges is where we now take concrete measures.
     *
     * @method
     * @argument {Object} object   - The object to delete.
     * @returns {external:Promise} - A promise fulfilled when the object has
     * been deleted. The promise's fulfillment value is not significant and will
     * usually be `null`.
     */
    deleteDataObject: {
        value: function (object) {

        }
    },



});