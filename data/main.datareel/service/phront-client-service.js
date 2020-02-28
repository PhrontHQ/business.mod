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
    Map = require("montage/collections/map"),
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    uuid = require("montage/core/uuid"),
    WebSocket = require("montage/core/web-socket").WebSocket,
    DataEvent = require("montage/data/model/data-event").DataEvent,
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
                // if(window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
                    this._socket = new WebSocket("ws://127.0.0.1:7272");
                // } else {
                    //this._socket = new WebSocket("wss://77mq8uupuc.execute-api.us-west-2.amazonaws.com/dev");
                //}

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
                    //Happens when serverless infra hasn't been used in a while:
                    //TODO: apptempt at least 1 re-try
                    //event.data: "{"message": "Internal server error", "connectionId":"HXT_RfBnPHcCIIg=", "requestId":"HXUAmGGZvHcF33A="}"
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

                    /*
                        Now that the distribution is done, we cleanup the matching:
                            this._pendingOperationById.set(operation.id, operation);
                        that we do in -_dispatchOperation
                    */
                    this._pendingOperationById.delete(operation.referrerId);
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

    createObjectDescriptorStore: {
        value: function (objectDescriptor) {
            console.log("create "+objectDescriptor.name);
            var iOperation = new DataOperation();

            iOperation.type = DataOperation.Type.Create;
            iOperation.data = objectDescriptor.module.id;
            iOperation.dataDescriptor = objectDescriptor.module.id;

            var createPromise = new Promise(function(resolve, reject) {
                iOperation._promiseResolve = resolve;
                iOperation._promiseReject = reject;
                });
            this._thenableByOperationId.set(iOperation.id,createPromise);
            this._dispatchOperation(iOperation);

            return createPromise;

        }
    },

    handleReadupdate: {
        value: function (operation) {
            var referrer = operation.referrerId,
            records = operation.data,
            stream = this._thenableByOperationId.get(referrer);
            //if(operation.type === DataOperation.Type.ReadUpdate) console.log("handleReadupdate  referrerId: ",referrer);

            if(records && records.length > 0) {

                //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
                this.addRawData(stream, records);
            }
        }
    },

    handleReadcompleted: {
        value: function (operation) {
            //console.log("handleReadcompleted  referrerId: ",operation.referrerId);
            this.handleReadupdate(operation);
            //The read is complete
            var stream = this._thenableByOperationId.get(operation.referrerId);
            this.rawDataDone(stream);
            this._thenableByOperationId.delete(operation.referrerId);

            //console.log("handleReadcompleted -clear _thenableByOperationId- referrerId: ",operation.referrerId);

        }
    },

    handleReadfailed: {
        value: function (operation) {
            var stream = this._thenableByOperationId.get(operation.referrerId);
            this.rawDataError(stream,operation.data);
            this._thenableByOperationId.delete(operation.referrerId);
        }
    },

    handleOperationCompleted: {
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

    handleOperationFailed: {
        value: function (operation) {
            var referrerOperation = this._pendingOperationById.get(operation.referrerId);

            /*
                After creation we need to do this:                   self.rootService.registerUniqueObjectWithDataIdentifier(object, dataIdentifier);

                The referrerOperation could get hold of object, but it doesn't right now.
                We could also create a uuid client side and not have to do that and deal wih it all in here which might be cleaner.

                Now resolving the promise finishes the job in saveObjectData that has the object in scope.
            */
            referrerOperation._promiseReject(operation);
        }
    },

    handleCreatecompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },


    handleUpdatecompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
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
            //Data coming from Postresql
            if(Array.isArray(rawData)) {
                return this.super(stream, JSON.parse(rawData[0].stringValue), context);
            }
            //Possible others
            else {
                return this.super(stream, rawData, context);
            }
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
            if(object.dataIdentifier) {
                var objectDescriptor = _objectDescriptor || this.objectDescriptorForObject(object),
                mapping = this.mappingWithType(objectDescriptor),
                //TODO: properly respect and implement up using what's in rawDataPrimaryKeys
                //rawDataPrimaryKeys = mapping ? mapping.rawDataPrimaryKeyExpressions : null,
                objectCriteria;

                objectCriteria = new Criteria().initWithExpression("id == $id", {id: object.dataIdentifier.primaryKey});
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

            //console.log(objectDescriptor.name+": fetchObjectProperty "+ " -"+propertyName);

            return this.fetchData(propertyNameQuery);
        }
    },

    //This probably isn't right and should be fetchRawData, but switching creates a strange error.
    fetchData: {
        value: function (query, stream) {
            var self = this;
            stream = stream || new DataStream();
            stream.query = query;

            // make sure type is an object descriptor or a data object descriptor.
            // query.type = this.rootService.objectDescriptorForType(query.type);


            this._socketOpenPromise.then(function() {
                var objectDescriptor = query.type,
                    criteria = query.criteria,
                    parameters = criteria ? criteria.parameters : undefined,
                    rawParameters = parameters,
                    readOperation = new DataOperation(),
                    promises,
                    serializedOperation;

                /*
                    We need to turn this into a Read Operation. Difficulty is to turn the query's criteria into
                    one that doesn't rely on objects. What we need to do before handing an operation over to another context
                    bieng a worker on the client side or a worker on the server side, is to remove references to live objects.
                    One way to do this is to replace every object in a criteria's parameters by it's data identifier.
                    Another is to serialize the criteria.
                */
                readOperation.type = DataOperation.Type.Read;
                readOperation.dataDescriptor = objectDescriptor.module.id;
                readOperation.criteria = query.criteria;
                readOperation.objectExpressions = query.prefetchExpressions;

                /*

                    this is half-assed, we're mapping full objects to RawData, but not the properties in the expression.
                    phront-service does it, but we need to stop doing it half way there and the other half over there.
                    SaveChanges is cleaner, but the job is also easier there.

                */
                if(parameters && typeof criteria.parameters === "object") {
                    var keys = Object.keys(parameters),
                        i, countI, iKey, iValue, iRecord;

                    rawParameters = Array.isArray(parameters) ? [] : {};

                    for(i=0, countI = keys.length;(i < countI); i++) {
                        iKey  = keys[i];
                        iValue = parameters[iKey];
                        if(iValue.dataIdentifier) {

                            /*
                                this isn't working because it's causing triggers to fetch properties we don't have
                                and somehow fails, but it's wastefull. Going back to just put primary key there.
                            */
                            // iRecord = {};
                            // rawParameters[iKey] = iRecord;
                            // (promises || (promises = [])).push(
                            //     self._mapObjectToRawData(iValue, iRecord)
                            // );
                            rawParameters[iKey] = iValue.dataIdentifier.primaryKey;

                        } else {
                            rawParameters[iKey] = iValue;
                        }

                    }
                    // if(promises) promises = Promise.all(promises);
                }
                if(!promises) promises = Promise.resolve(true);
                promises.then(function() {
                    if(criteria) readOperation.criteria.parameters = rawParameters;
                    self._dispatchReadOperation(readOperation, stream);
                    if(criteria) readOperation.criteria.parameters = parameters;

                });
            });

          return stream;
        }
    },

    _processObjectChangesForProperty: {
        value: function(object, aProperty, aPropertyDescriptor, aRawProperty, aPropertyChanges, operationData, snapshot, dataSnapshot) {
            var self = this,
                aPropertyDeleteRule = aPropertyDescriptor ? aPropertyDescriptor.deleteRule : null;
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


    handleCreatetransactioncompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },
    handleCreatetransactionfailed: {
        value: function (operation) {
            this.handleOperationFailed(operation);
        }
    },
    handleBatchcompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },
    handleBatchfailed: {
        value: function (operation) {
            this.handleOperationFailed(operation);
        }
    },
    handlePerformtransactioncompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },
    handlePerformtransactionfailed: {
        value: function (operation) {
            this.handleOperationFailed(operation);
        }
    },
    handleRollbacktransactioncompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },
    handleRollbacktransactionfailed: {
        value: function (operation) {
            this.handleOperationFailed(operation);
        }
    },


    /**
     * evaluates the validity of objects and store results in invaliditySates
     * @param {Array} objects objects whose validity needs to be evaluated
     * @param {Map} invaliditySates a Map where the key is an object and the value a validity state offering invalidity details.
     * @returns {Promise} Promise resolving to invaliditySates when all is complete.
     */

     _evaluateObjectValidity: {
        value: function (object, invalidityStates, transactionObjectDescriptors) {
            var objectDescriptorForObject = this.objectDescriptorForObject(object);

            transactionObjectDescriptors.add(objectDescriptorForObject);
            return objectDescriptorForObject.evaluateObjectValidity(object)
            .then(function(objectInvalidityStates) {
                if(objectInvalidityStates.size != 0) {
                    invalidityStates.set(object,objectInvalidityStates);
                }
            });
        }
    },

    _evaluateObjectsValidity: {
        value: function (objects, invalidityStates, validityEvaluationPromises, transactionObjectDescriptors) {
            //Bones only for now
            //It's a bit weird, createdDataObjects is a set, but changedDataObjects is a Map, but changedDataObjects has entries
            //for createdObjects as well, so we might be able to simlify to just dealing with a Map, or send the Map keys?
            var iterator = objects.values(), iObject, promises = validityEvaluationPromises || [];

            while(iObject = iterator.next().value) {
                promises.push(this._evaluateObjectValidity(iObject,invalidityStates, transactionObjectDescriptors));
            }

            return promises.length > 1 ? Promise.all(promises) : promises[0];
        }
    },

    _dispatchObjectsInvalidity: {
        value: function(dataObjectInvalidities) {
            var invalidObjectIterator = dataObjectInvalidities.keys(),
                anInvalidObject, anInvalidityState;

            while(anInvalidObject = invalidObjectIterator.next().value) {
                this.dispatchDataEventTypeForObject(DataEvent.invalid, object, dataObjectInvalidities.get(anInvalidObject));
            }
        }
    },

    saveChanges: {
        value: function () {

            //If nothing to do, we bail out as early as possible.
            if(this.createdDataObjects.size === 0 && this.changedDataObjects.size === 0 && this.deletedDataObjects.size === 0) {
                var noOpOperation = new DataOperation();
                noOpOperation.type = DataOperation.Type.NoOp;
                return Promise.resolve(noOpOperation);
            }

            var self = this,
            //Ideally, this should be saved in IndexedDB so if something happen
            //we can at least try to recover.
            createdDataObjects = new Set(this.createdDataObjects),//Set
            changedDataObjects = new Set(this.changedDataObjects),//Set
            deletedDataObjects = new Set(this.deletedDataObjects),//Set
            dataObjectChanges = new Map(this.dataObjectChanges);//Map

            //We've made copies, so we clear right away to make room for a new cycle:
            this.createdDataObjects.clear();
            this.changedDataObjects.clear();
            this.deletedDataObjects.clear();
            this.dataObjectChanges.clear();

            return new Promise(function(resolve, reject) {
                try {

                    //We need a list of the changes happening (creates, updates, deletes) operations
                    //to keep their natural order and be able to create a transaction operationn
                    //when saveChanges is called.

                    /*
                        We make shallow copy of the sets and dataObjectChanges at the time we start,
                        as there are multiple async steps and the client can create new changes/objects
                        as soon as the main loop gets back in the user's hands.
                    */

                    var deletedDataObjectsIterator,
                        operation,
                        createTransaction,
                        createTransactionPromise,
                        transactionObjectDescriptors = new Set(),
                        transactionObjecDescriptorModuleIds,
                        batchOperation,
                        batchOperationPromise,
                        batchedOperationPromises,
                        dataOperationsByObject = new Map(),
                        changedDataObjectOperations = new Map(),
                        deletedDataObjectOperations = new Map(),
                        createOperationType = DataOperation.Type.Create,
                        updateOperationType = DataOperation.Type.Update,
                        deleteOperationType = DataOperation.Type.Delete,
                        i, countI, iObject, iOperation, iOperationPromise,
                        createdDataObjectInvalidity = new Map(),
                        changedDataObjectInvalidity = new Map(),
                        deletedDataObjectInvalidity = new Map(),
                        validityEvaluationPromises = [], validityEvaluationPromise,
                        performTransactionOperation,
                        performTransactionOperationPromise,
                        rollbackTransactionOperation,
                        rollbackTransactionOperationPromise,
                        rawTransactionId;



                    //We first remove from create and update objects that are also deleted:
                    deletedDataObjectsIterator = deletedDataObjects.values();
                    while(iObject = deletedDataObjectsIterator.next().value) {
                        createdDataObjects.delete(iObject);
                        changedDataObjects.delete(iObject);
                    }


                    //If nothing to do, we bail out
                    if(createdDataObjects.size === 0 && changedDataObjects.size === 0 && deletedDataObjects.size === 0) {
                        operation = new DataOperation();
                        operation.type = DataOperation.Type.NoOp;
                        resolve(operation);
                    }

                    //we assess object's validity:
                    self._evaluateObjectsValidity(createdDataObjects,createdDataObjectInvalidity, validityEvaluationPromises, transactionObjectDescriptors);

                    //then changedDataObjects.
                    self._evaluateObjectsValidity(changedDataObjects,changedDataObjectInvalidity, validityEvaluationPromises, transactionObjectDescriptors);

                    //Finally deletedDataObjects: it's possible that some validation logic prevent an object to be deleted, like
                    //a deny for a relationship that needs to be cleared by a user before it could be deleted.
                    self._evaluateObjectsValidity(deletedDataObjects,deletedDataObjectInvalidity, validityEvaluationPromises, transactionObjectDescriptors);

                    //TODO while we need to wait for both promises to resolve before we can check
                    //that there are no validation issues and can proceed to save changes
                    //it might be better to dispatch events as we go within each promise
                    //so we don't block the main thread all at once?
                    //Waiting has the benefit to enable a 1-shot rendering.
                    return Promise.all(validityEvaluationPromises)
                    .then(function() {
                        // self._dispatchObjectsInvalidity(createdDataObjectInvalidity);
                        self._dispatchObjectsInvalidity(changedDataObjectInvalidity);
                        if(changedDataObjectInvalidity.size > 0) {
                            //Do we really need the DataService itself to dispatch another event with all invalid data together at once?
                            //self.mainService.dispatchDataEventTypeForObject(DataEvent.invalid, self, detail);

                            var validatefailedOperation = new DataOperation;
                            validatefailedOperation.type = DataOperation.Type.ValidateFailed;
                            //At this point, it's the dataService
                            validatefailedOperation.target = self.mainService;
                            validatefailedOperation.data = changedDataObjectInvalidity;
                            //Exit, can't move on
                            resolve(validatefailedOperation);
                        }
                        else {
                            return transactionObjectDescriptors;
                        }
                    }, function(error) {
                        reject(error);
                    })
                    .then(function(transactionObjectDescriptors) {
                        //Now that all objects are valid we can proceed and kickstart a transaction as it needs to do the round trip
                        //We keep the promise and continue to prepare the work.
                        return self._socketOpenPromise.then(function () {

                            var _createTransactionPromise;

                            createTransaction = new DataOperation();
                            createTransaction.type = DataOperation.Type.CreateTransaction;
                            createTransaction.dataDescriptor = transactionObjecDescriptorModuleIds = transactionObjectDescriptors.map((objectDescriptor) => {return objectDescriptor.module.id});

                            _createTransactionPromise = new Promise(function(resolve, reject) {
                                createTransaction._promiseResolve = resolve;
                                createTransaction._promiseReject = reject;
                            });
                            self._thenableByOperationId.set(createTransaction.id,_createTransactionPromise);

                            self._dispatchOperation(createTransaction);

                            return _createTransactionPromise;
                        }, function(error) {
                            console.error("Error tryimng to communicate with server");
                            reject(error);
                        });
                    }, function(error) {
                        reject(error);
                    })
                    .then(function(createTransactionResult) {
                        var iterator;

                        if(createTransactionResult.type === DataOperation.Type.CreateTransactionFailed) {
                            var error = new Error("CreateTransactionFailed");
                            error.details = createTransactionResult;
                            return reject(error);
                        }

                        rawTransactionId = createTransactionResult.data.transactionId;

                        /*
                            Now that we have cleaned sets, an open transaction, we build all individual operations. Rigth now we have lost the timestamps related to individual changes. If it turns out we need it (EOF/CoreData have it along with a delegate method to intervene) then the recording of changes in DataService will need to be overahauled to track timestamps. When we add undoManagementt to DataService, that subsystem will have every single change in a list as they happen and could also be leveraged?
                        */
                        batchedOperationPromises = [];

                        //we start by createdObjects:
                        // for(i=0, countI = createdDataObjects.length;(i<countI);i++) {
                        //     iObject = createdDataObjects[i];
                        //     iOperationPromise = self.saveDataOperationForObject(object);
                        //     batchedOperationPromises.push(iOperationPromise);
                        // }

                        //We want createdDataObjects operations first:
                        iterator = createdDataObjects.values();
                        while(iObject = iterator.next().value) {
                            batchedOperationPromises.push(self._saveDataOperationForObject(iObject, createOperationType, dataObjectChanges, dataOperationsByObject));
                        }

                        //Loop over changedDataObjects:
                        iterator = changedDataObjects.values();
                        while(iObject = iterator.next().value) {
                            batchedOperationPromises.push(self._saveDataOperationForObject(iObject, updateOperationType, dataObjectChanges, dataOperationsByObject));
                        }

                        //And complete by deletedDataObjects:
                        iterator = deletedDataObjects.values();
                        while(iObject = iterator.next().value) {
                            batchedOperationPromises.push(self._saveDataOperationForObject(iObject, deleteOperationType, dataObjectChanges, dataOperationsByObject));
                        }

                        return Promise.all(batchedOperationPromises);

                    }, function(error) {
                        reject(error);
                    })
                    .then(function(batchedOperations) {
                        //Now proceed to build the batch operation
                        //We may have some no-op in there as we didn't cacth them...
                        batchOperation = new DataOperation();
                        batchOperation.type = DataOperation.Type.Batch;
                        batchOperation.dataDescriptor = transactionObjecDescriptorModuleIds,
                        batchOperation.data = {
                                batchedOperations: batchedOperations,
                                transactionId: rawTransactionId
                        };
                        batchOperation.referrerId = createTransaction.id;

                        batchOperationPromise = new Promise(function(resolve, reject) {
                            batchOperation._promiseResolve = resolve;
                            batchOperation._promiseReject = reject;
                        });
                        self._thenableByOperationId.set(batchOperation.id,batchOperationPromise);

                        self._dispatchOperation(batchOperation);

                        return batchOperationPromise;
                    }, function(error) {
                        reject(error);
                    })
                    .then(function(batchedOperationResult) {
                        var transactionId = batchedOperationResult.data.transactionId;

                        if(batchedOperationResult.type === DataOperation.Type.BatchCompleted) {
                            //We proceed to commit:
                            performTransactionOperation = new DataOperation();
                            performTransactionOperation.type = DataOperation.Type.PerformTransaction;
                            performTransactionOperation.dataDescriptor = transactionObjecDescriptorModuleIds,
                            //Not sure we need any data here?
                            //performTransactionOperation.data = batchedOperations;
                            performTransactionOperation.referrerId = createTransaction.id;
                            performTransactionOperation.data = {
                                transactionId: transactionId
                            };

                            performTransactionOperationPromise = new Promise(function(resolve, reject) {
                                performTransactionOperation._promiseResolve = resolve;
                                performTransactionOperation._promiseReject = reject;
                            });
                            self._thenableByOperationId.set(performTransactionOperation.id,performTransactionOperationPromise);

                            self._dispatchOperation(performTransactionOperation);

                            return performTransactionOperationPromise;
                        } else if(batchedOperationResult.type === DataOperation.Type.BatchFailed) {
                            //We need to rollback:

                            rollbackTransactionOperation = new DataOperation();
                            rollbackTransactionOperation.type = DataOperation.Type.RollbackTransaction;
                            rollbackTransactionOperation.dataDescriptor = transactionObjecDescriptorModuleIds,
                            //Not sure we need any data here?
                            // rollbackTransactionOperation.data = batchedOperations;
                            rollbackTransactionOperation.referrerId = createTransaction.id;
                            rollbackTransactionOperation.data = {
                                transactionId: transactionId
                            };

                            rollbackTransactionOperationPromise = new Promise(function(resolve, reject) {
                                rollbackTransactionOperation._promiseResolve = resolve;
                                rollbackTransactionOperation._promiseReject = reject;
                            });
                            self._thenableByOperationId.set(rollbackTransactionOperation.id,rollbackTransactionOperationPromise);

                            self._dispatchOperation(rollbackTransactionOperation);

                            return rollbackTransactionOperationPromise;

                        } else {
                            console.error("- saveChanges: Unknown batchedOperationResult:",batchedOperationResult);
                            reject(new Error("- saveChanges: Unknown batchedOperationResult:"+JSON.stringify(batchedOperationResult)));
                        }
                    }, function(error) {
                        reject(error);
                    })
                    .then(function(transactionOperationResult) {
                        if(transactionOperationResult.type === DataOperation.Type.PerformTransactionCompleted) {
                            //We need to do what we did im saveDataObjects, for each created, updated and deleted obect.
                            self.didCreateDataObjects(createdDataObjects, dataOperationsByObject);
                            self.didUpdateDataObjects(changedDataObjects, dataOperationsByObject);
                            self.didDeleteDataObjects(deletedDataObjects, dataOperationsByObject);

                        } else if(transactionOperationResult.type === DataOperation.Type.PerformTransactionFailed) {
                            console.error("Missing logic for PerformTransactionFailed");

                        } else if(transactionOperationResult.type === DataOperation.Type.RollbackTransactionCompleted) {
                            console.error("Missing logic for RollbackTransactionCompleted");

                        } else if(transactionOperationResult.type === DataOperation.Type.RollbackTransactionFailed) {
                            console.error("Missing logic for RollbackTransactionFailed");
                        }
                        else {
                            console.error("- saveChanges: Unknown transactionOperationResult:",transactionOperationResult);

                            reject(new Error("- saveChanges: Unknown transactionOperationResult:"+JSON.stringify(transactionOperationResult)));
                        }

                        resolve(transactionOperationResult);

                    }, function(error) {
                        reject(error);
                    });

                }
                catch (error) {
                    reject(error);
                }
            });

            // .then(function(createTransactionResult) {

            //     if(createTransactionResult.type === DataOperation.Type.CreateTransactionFailed) {

            //     } else {

            //     }



            // })



                //Loop, get data operation, discard the no-ops (and clean changes)

            /*
                Here we want to create a transaction to make sure everything is sent at the same time.
                - We wneed to act on delete rules in relationships on reverse. So an update could lead to a delete operatiom
                so we need to process updates before we process deletes.
                    - we need to check no deleted object is added to a relationoship to-one or to-many while we process updates
            */
        }
    },



    didCreateDataObjects: {
        value: function(createdDataObjects, dataOperationsByObject) {
/*
            //rawData contains the id, in case it was generated
            //by the database
            var  referrerOperation = this._pendingOperationById.get(operation.referrerId),
                dataIdentifier = this.dataIdentifierForObject(object),
                objectDescriptor = this.objectDescriptorForObject(object),
                rawData, snapshot = {};
*/
            var i, countI, iObject, iOperation, iObjectDescriptor, iDataIdentifier, iterator = createdDataObjects.values(), saveEventDetail = {
                created: true
            };
            while(iObject = iterator.next().value) {
                iOperation = dataOperationsByObject.get(iObject);
                iObjectDescriptor = this.objectDescriptorWithModuleId(iOperation.dataDescriptor);
                iDataIdentifier = this.dataIdentifierForTypeRawData(iObjectDescriptor,iOperation.data);

                this.recordSnapshot(iDataIdentifier, iOperation.data);
                this.rootService.registerUniqueObjectWithDataIdentifier(iObject, iDataIdentifier);

                this.dispatchDataEventTypeForObject(DataEvent.save, iObject, saveEventDetail);

            }
        }
    },

    didUpdateDataObjects: {
        value: function(changedDataObjects, dataOperationsByObject) {
/*
            //rawData contains the id, in case it was generated
            //by the database
            var  referrerOperation = this._pendingOperationById.get(operation.referrerId),
                dataIdentifier = this.dataIdentifierForObject(object),
                objectDescriptor = this.objectDescriptorForObject(object),
                rawData, snapshot = {};
*/
            //TODO: dispatch

            var i, countI, iObject, iOperation, iDataIdentifier, iterator = changedDataObjects.values(), saveEventDetail = {
                changes: null
            };

            while(iObject = iterator.next().value) {
                iOperation = dataOperationsByObject.get(iObject);

                // referrerOperation = self._pendingOperationById.get(operation.referrerId);
                iDataIdentifier = this.dataIdentifierForObject(iObject);
                this.recordSnapshot(iDataIdentifier, iOperation.data);
                saveEventDetail.changes = iOperation.changes;
                this.dispatchDataEventTypeForObject(DataEvent.save, iObject, saveEventDetail);
            }

        }
    },

    didDeleteDataObjects: {
        value: function(deletedDataObjects, dataOperationsByObject) {

            var i, countI, iObject, iOperation, iDataIdentifier, iterator = deletedDataObjects.values();

            /*
                We need to cleanup:
                - dispatch "delete" event now that it's done.
                - remove snapshot about that object, remove dataIdentifier,
            */

            while(iObject = iterator.next().value) {
                iOperation = dataOperationsByObject.get(iObject);

                // referrerOperation = this._pendingOperationById.get(operation.referrerId);
                iDataIdentifier = this.dataIdentifierForObject(iObject);

                //Removes the snapshot we have for iDataIdentifier
                this.removeSnapshot(iDataIdentifier);

                this.dispatchDataEventTypeForObject(DataEvent.delete, iObject);
            }

        }
    },




    /**
     * Creates one save operation for an object, eirher a create, an update or a delete
     * .
     *
     * @method
     * @argument {Object} object - The object whose data should be saved.
     * @argument {DataOperation.Type} operationType - The object whose data should be saved.
     * @returns {external:Promise} - A promise fulfilled when the operationo is ready.
     *
     */

    _saveDataOperationForObject: {
        value: function (object, operationType, dataObjectChangesMap, dataOperationsByObject) {
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
                    snapshot = Object.assign({},object.dataIdentifier && this.snapshotForDataIdentifier(object.dataIdentifier)),
                    dataSnapshot = {},
                    snapshotValue,
                    dataObjectChanges = dataObjectChangesMap.get(object),
                    propertyIterator,
                    aProperty, aRawProperty,
                    isNewObject = operationType
                        ? operationType === DataOperation.Type.Create
                        : self.rootService.createdDataObjects.has(object),
                    localOperationType = operationType
                                        ? operationType
                                        : isNewObject
                                            ? DataOperation.Type.Create
                                            : DataOperation.Type.Update,
                    isDeletedObject = localOperationType === DataOperation.Type.Delete,
                    operationData = {},
                    mappingPromise,
                    mappingPromises,
                    i, iValue, countI;

                operation.target = operation.dataDescriptor = objectDescriptor.module.id;

                operation.type = localOperationType;

                if(dataIdentifier) {
                    if(!isNewObject) {
                        operation.criteria = this.rawCriteriaForObject(object, objectDescriptor);
                    }
                    else {
                        operationData.id = dataIdentifier.primaryKey;
                    }
                }

                //Nothing to do, change the operation type and bail out
                if(!isNewObject && !dataObjectChanges && !isDeletedObject) {
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

                        For deletedObjects, if there were changes, we don't care about them, it's not that relevant, we're going to use all known properties fetched client side to eventually catch a conflict if someone made a change in-between.
                    */
                    if(!isNewObject) {
                        operation.snapshot = dataSnapshot;
                    }

                    propertyIterator = isDeletedObject
                        ? Object.keys(object).values()
                        : dataObjectChanges.keys();
                    while(aProperty = propertyIterator.next().value) {
                        aRawProperty = mapping.mapObjectPropertyNameToRawPropertyName(aProperty);
                        snapshotValue = snapshot[aRawProperty];
                        aPropertyChanges = dataObjectChanges ? dataObjectChanges.get(aProperty) : undefined;
                        aPropertyDescriptor = objectDescriptor.propertyDescriptorForName(aProperty);

                        //For delete, we're looping over Object.keys(object), which may contain properties that aren't
                        //serializable. Ourr goal for delete is to use these values for optimistic locking, so no change, no need
                        //If we pass this down to _processObjectChangesForProperty, it will attempt to map and fail if no aPropertyDescriptor
                        //exists. So we catch it here since we know the context about the operation.
                        if(isDeletedObject && (!aPropertyDescriptor || !aPropertyChanges)) {
                            continue;
                        }

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

                        if(!isDeletedObject && Object.keys(operationData).length === 0) {
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
                           if(!isDeletedObject) {
                                //We cache the changes on the operation. As this isn't part of an operation's serializeSelf,
                                //we keep track of it for dispatching events when save is complete and don't have to worry
                                //about side effects for the server side.
                                operation.changes = dataObjectChanges;
                            }
                            //self.clearRegisteredChangesForDataObject(object);
                        }
                        if(dataOperationsByObject) {
                            dataOperationsByObject.set(object,operation);
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
                    // snapshot = Object.assign({},object.dataIdentifier && this.snapshotForDataIdentifier(object.dataIdentifier)),
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



                return this._saveDataOperationForObject(object, undefined, dataObjectChanges).then(function(operation) {

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
    //             snapshot = Object.assign({},object.dataIdentifier && this.snapshotForDataIdentifier(object.dataIdentifier)),
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
            var snapshot = object.dataIdentifier && this.snapshotForDataIdentifier(object.dataIdentifier);

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
    //                 snapshot = this.snapshotForDataIdentifier(object.dataIdentifier),
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
            }
            this.rawDataDone(stream);

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
