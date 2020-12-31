var DataService = require("montage/data/service/data-service").DataService,
    RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    Criteria = require("montage/core/criteria").Criteria,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    DataQuery = require("montage/data/model/data-query").DataQuery,
    DataStream = require("montage/data/service/data-stream").DataStream,
    Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    DataOrdering = require("montage/data/model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("montage/core/frb/evaluate"),
    Set = require("montage/core/collections/set"),
    Map = require("montage/core/collections/map"),
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    uuid = require("montage/core/uuid"),
    Phluid = require("./phluid").Phluid,
    WebSocket = require("montage/core/web-socket").WebSocket,
    DataEvent = require("montage/data/model/data-event").DataEvent,
    DeleteRule = require("montage/core/meta/property-descriptor").DeleteRule,
    Locale = require("montage/core/locale").Locale,
    PGClass = require("../model/p-g-class").PGClass,
    //DataTrigger = require("./data-trigger").DataTrigger,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
    RawEmbeddedValueToObjectConverter = require("montage/data/converter/raw-embedded-value-to-object-converter").RawEmbeddedValueToObjectConverter,
    currentEnvironment = require("montage/core/environment").currentEnvironment,
    PhrontClientService;

//Set our DataTrigger custom subclass:
//DataService.prototype.DataTrigger = DataTrigger;


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

            this._thenableByOperationId = new Map();
            this._pendingOperationById = new Map();

            // this._serializer = new MontageSerializer().initWithRequire(require);
            // this._deserializer = new Deserializer();

            this.addOwnPropertyChangeListener("mainService", this);

            return this;
        }
    },

    handleMainServiceChange: {
        value: function (mainService) {
            //That only happens once
            if(mainService) {
                mainService.addEventListener(DataOperation.Type.NoOp,this,false);
                mainService.addEventListener(DataOperation.Type.ReadFailed,this,false);
                mainService.addEventListener(DataOperation.Type.ReadCompleted,this,false);
                mainService.addEventListener(DataOperation.Type.UpdateFailed,this,false);
                mainService.addEventListener(DataOperation.Type.UpdateCompleted,this,false);
                mainService.addEventListener(DataOperation.Type.CreateFailed,this,false);
                mainService.addEventListener(DataOperation.Type.CreateCompleted,this,false);
                mainService.addEventListener(DataOperation.Type.DeleteFailed,this,false);
                mainService.addEventListener(DataOperation.Type.DeleteCompleted,this,false);
                mainService.addEventListener(DataOperation.Type.CreateTransactionFailed,this,false);
                mainService.addEventListener(DataOperation.Type.CreateTransactionCompleted,this,false);
                mainService.addEventListener(DataOperation.Type.BatchCompleted,this,false);
                mainService.addEventListener(DataOperation.Type.BatchFailed,this,false);
                mainService.addEventListener(DataOperation.Type.TransactionUpdated,this,false);
                mainService.addEventListener(DataOperation.Type.PerformTransactionFailed,this,false);
                mainService.addEventListener(DataOperation.Type.PerformTransactionCompleted,this,false);
                mainService.addEventListener(DataOperation.Type.RollbackTransactionFailed,this,false);
                mainService.addEventListener(DataOperation.Type.RollbackTransactionCompleted,this,false);
                }
        }
    },

    __socketOpenPromise: {
        value: Promise.resolve(true)
    },

    _socketOpenPromise: {
        get: function() {
            if(!this.__socketOpenPromise) {
                var self = this;
                this.__socketOpenPromise = new Promise(function(resolve, reject) {
                    self._socketOpenPromiseResolve = resolve;
                    self._socketOpenPromiseReject = reject;

                    self._createSocket();

                });
            }
            return this.__socketOpenPromise;
        }
    },

    // deserializedFromSerialization: {
    //     value: function () {
    //         if(!this.connection && this.connectionDescriptor) {
    //             var stage = currentEnvironment.stage,
    //                     connection, websocketURL;

    //             if(global.location) {
    //                 if(stage === "dev" || global.location.hostname === "127.0.0.1" || global.location.hostname === "localhost" || global.location.hostname.endsWith(".local") ) {
    //                     connection = this.connectionForIdentifier(stage);
    //                     websocketURL = new URL(connection.websocketURL);

    //                     if(global.location.hostname === "localhost" && currentEnvironment.isAndroidDevice && websocketURL.hostname.endsWith(".local")) {
    //                         websocketURL.hostname = "localhost";
    //                         connection.websocketURL = websocketURL.toString();
    //                     }
    //                     this.connection = connection;
    //                 } else {

    //                     if(!stage) {
    //                         stage = "prod";
    //                     }

    //                     connection = this.connectionForIdentifier(stage);

    //                     // //Let's try to read the stage from the URL?
    //                     // for(var i=0, connectionIdentifiers = Object.keys(this.connectionDescriptor), countI = connectionIdentifiers.length, iConnectionIdentifier, iConnection;(i<countI); i++) {
    //                     //     iConnectionIdentifier = connectionIdentifiers[i];
    //                     //     iConnection = this.connectionDescriptor[iConnectionIdentifier];

    //                     //     //TOTO: in the URL based on AWS conventions? as a url argument?
    //                     // }

    //                     if(!this.connection) {
    //                         this.connection = connection;
    //                     }

    //                 }
    //             } else if(defaultEventManager.application) {
    //                 defaultEventManager.application.addEventListener(DataOperation.Type.Connect,this,false);
    //             }

    //         }

    //         if(this.connection && (typeof WebSocket !== "undefined")) {
    //             this._createSocket();
    //         }

    //     }
    // },


    /*
     * The current DataConnection object used to connect to data source
     *
     * @type {DataConnection}
     */
    _connection: {
        value: undefined
    },

    connection: {
        get: function() {
            if(!this._connection) {
                var stage = currentEnvironment.stage || "prod",
                    connection = this.connectionForIdentifier(stage),
                        websocketURL;

                if(global.location) {
                    if(stage === "dev" || global.location.hostname === "127.0.0.1" || global.location.hostname === "localhost" || global.location.hostname.endsWith(".local") ) {
                        websocketURL = new URL(connection.websocketURL);

                        if(global.location.hostname === "localhost" && currentEnvironment.isAndroidDevice && websocketURL.hostname.endsWith(".local")) {
                            websocketURL.hostname = "localhost";
                            connection.websocketURL = websocketURL.toString();
                        }
                    }
                }
                this._connection = connection;
            }
            return this._connection;
        }
    },

    /*
        TODO: handle switch
    */
    _createSocket: {
        value: function() {
            this._socket = new WebSocket(this.connection.websocketURL);

            this._socket.addEventListener("open", this);
            this._socket.addEventListener("error", this);
            this._socket.addEventListener("close", this);
            this._socket.addEventListener("message", this);

        }
    },

    // handleConnect: {
    //     value: function (connectOperation) {
    //         var stage = connectOperation.context.requestContext.stage;

    //         currentEnvironment.stage = stage;
    //         console.log("client ip address:"+connectOperation.context.requestContext.identity.sourceIp);

    //         /*
    //             The stage allows us to pick the right Database Connection among the ones we've been told.
    //             We only set it once on connect as it's less frequent and it won't change for the duration the lambda will be active.
    //         */
    //         if(!this.stage) {
    //             this.connectionIdentifier = stage;
    //         }

    //         this._createSocket();

    //     }
    // },

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
            return this._authorizationPolicy;
        },
        set: function(value) {
            this._authorizationPolicy = value;
        }
    },

    handleOpen: {
        value: function (event) {
            console.log("WebSocket opened");
            //Get the RawDataTypeIDs
            // this.fetchRawDataTypeIds()
            // .then( function() {
                this._socketOpenPromiseResolve(true);
            // });
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
            console.log("received socket message ",event);
                serializedOperation = event.data;
                //console.log("<---- receive operation "+serializedOperation);


            if(serializedOperation) {
                var deserializedOperation,
                operation,
                objectRequires,
                module,
                isSync = true;

                if(serializedOperation.indexOf('{"message": "Internal server error"') === 0) {
                     console.warn(event.data);
                } else {
                    try {
                        this._deserializer.init(serializedOperation, require, objectRequires, module, isSync);
                        operation = this._deserializer.deserializeObject();
                    } catch (e) {
                        //Happens when serverless infra hasn't been used in a while:
                        //TODO: apptempt at least 1 re-try
                        //event.data: "{"message": "Internal server error", "connectionId":"HXT_RfBnPHcCIIg=", "requestId":"HXUAmGGZvHcF33A="}"

                        return console.error("Invalid Operation Serialization:", event.data);
                    }
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

    operationReferrer: {
        value: function(operation) {
            return this._pendingOperationById.get(operation.referrerId);
        }
    },

    registerPendingOperation: {
        value: function(operation, referrer) {
            this._pendingOperationById.set(operation.id, operation);

        }
    },

    unregisterOperationReferrer: {
        value: function(operation) {
            this._pendingOperationById.delete(operation.referrerId);
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
            iOperation.target = objectDescriptor;

            var createPromise = new Promise(function(resolve, reject) {
                iOperation._promiseResolve = resolve;
                iOperation._promiseReject = reject;
                });
            this._thenableByOperationId.set(iOperation.id,createPromise);
            this._dispatchOperation(iOperation);

            return createPromise;

        }
    },

    handleReadUpdate: {
        value: function (operation) {
            var referrer = operation.referrerId,
                objectDescriptor = operation.target,
                records = operation.data,
                stream = this._thenableByOperationId.get(referrer),
                streamObjectDescriptor;
            // if(operation.type === DataOperation.Type.ReadCompleted) {
            //     console.log("handleReadCompleted  referrerId: ",operation.referrerId, "records.length: ",records.length);
            // } else {
            //     console.log("handleReadUpdate  referrerId: ",operation.referrerId, "records.length: ",records.length);
            // }
            //if(operation.type === DataOperation.Type.ReadUpdate) console.log("handleReadUpdate  referrerId: ",referrer);

            if(stream) {
                streamObjectDescriptor = stream.query.type;
                /*

                    We now could get readUpdate that are reads for readExpressions that are properties (with a valueDescriptor) of the ObjectDescriptor of the referrer. So we need to add a check that the obectDescriptor maatch, otherwise, it needs to be assigned to the right instance, or created in memory and mapping/converters will find it.
                */

                if(streamObjectDescriptor === objectDescriptor) {
                    if(records && records.length > 0) {
                        //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
                        this.addRawData(stream, records, operation);
                    } else if(operation.type !== DataOperation.Type.ReadCompleted){
                        console.log("operation of type:"+operation.type+", has no data");
                    }
                } else {
                    console.log("Received "+operation.type+" operation that is for a readExpression of referrer ",referrer);
                }
            } else {
                console.log("receiving operation of type:"+operation.type+", but can't find a matching stream");
            }
        }
    },

    handleReadCompleted: {
        value: function (operation) {
            this.handleReadUpdate(operation);
            //The read is complete
            var stream = this._thenableByOperationId.get(operation.referrerId);
            if(stream) {
                this.rawDataDone(stream);
                this._thenableByOperationId.delete(operation.referrerId);
            } else {
                console.log("receiving operation of type:"+operation.type+", but can't find a matching stream");
            }
            //console.log("handleReadCompleted -clear _thenableByOperationId- referrerId: ",operation.referrerId);

        }
    },

    handleReadFailed: {
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
                Right now, we listen for the types we care about, on the mainService, so we're receiving it all,
                even those from other data services / types we don' care about, like the PlummingIntakeDataService.

                One solution is to, when we register the types in the data service, to test if it handles operations, and if it does, the add all listeners. But that's a lot of work which will slows down starting time. A better solution would be to do like what we do with Components, where we find all possibly interested based on DOM structure, and tell them to prepare for a first delivery of that type of event. We could do the same as we know which RawDataService handle what ObjectDescriptor, which would give the RawDataService the ability to addListener() right when it's about to be needed.

                Another solution could involve different "pools" of objects/stack, but we'd lose the universal bus.

            */
            if(!referrerOperation) {
                return;
            }

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
            referrerOperation._promiseResolve(operation);
        }
    },

    handleCreateCompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },


    handleUpdateCompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },


    handleClose: {
        value: function (event) {
            console.log("WebSocket closed with message:",event);
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

            defaultEventManager.handleEvent(operation);

            // var serializedOperation = this._serializer.serializeObject(operation);

            // // if(operation.type === "batch") {
            // //     var deserializer = new Deserializer();
            // //     deserializer.init(serializedOperation, require, undefined, module, true);
            // //     var deserializedOperation = deserializer.deserializeObject();

            // //     console.log(deserializedOperation);

            // // }
            // console.log("----> send operation "+serializedOperation);
            // this._socket.send(serializedOperation);
        }
    },

/*
    First shot at batching reads:
    - Aurora DataAPI doesn't return a result for each select in the bacth, just the firs
    - handleRead in PhrontService is served by an event now and there's something not square with OperationCoordinator if we use this.handleRead directly - _operationPromisesByReferrerId doesn't have the entry set when it goes through the OperationCoordinator itself. So hanleRead would need to be decoupled.
    - So our only hope to batch reads is to do an "or" or a in from single values
    - should we do that transformation in PhrontService, as an implementation detail of a batch of reads, ideally client would batch only reads from the same type knowing wat happens
    - or should the client make 1 read operation that is an or or in, well a read that involve more? Because each converter think it's doing a fetch, so either way, that promise needs to resolve the individual value matching that criteria of that converter.
*/

/*
    _dispatchOperationQueue: {
        value: []
    },

    _dispatchOperation: {
        value: function(operation) {
            this._pendingOperationById.set(operation.id, operation);

            if(operation.type === DataOperation.Type.Read) {
                this._dispatchOperationQueue.push(operation);

                if (this._dispatchOperationQueue.length === 1) {
                    queueMicrotask(() => {
                        var _operation;
                        if(this._dispatchOperationQueue.length > 1) {
                            _operation = new DataOperation();
                            _operation.type = DataOperation.Type.Batch;
                            // batchOperation.target= transactionObjecDescriptors,
                            _operation.data = {
                                    batchedOperations: this._dispatchOperationQueue
                            };
                            this._pendingOperationById.set(_operation.id, _operation);
                        } else {
                            _operation = this._dispatchOperationQueue[0];
                        }

                        var serializedOperation = this._serializer.serializeObject(_operation);
                        this._socket.send(serializedOperation);
                        this._dispatchOperationQueue.length = 0;

                    });
                }
            } else {
                var serializedOperation = this._serializer.serializeObject(operation);
                //console.log("----> send operation "+serializedOperation);
                this._socket.send(serializedOperation);
            }

        }
    },
    */

    rawCriteriaForObject: {
        value: function(object, _objectDescriptor) {
            if(object.dataIdentifier) {
                var objectDescriptor = _objectDescriptor || this.objectDescriptorForObject(object),
                mapping = this.mappingForType(objectDescriptor),
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
                return Criteria.withExpression("identifier == $identifier", {"identifier":dataIdentifier});
            } else {
                //It's a new object and we don't have a uuid?, we can't create a criteria for it
                return null;
            }
        }
    },


    fetchObjectProperty: {
        value: function (object, propertyName) {
            var self = this,
                objectDescriptor = this.objectDescriptorForObject(object),
                propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName),
                valueDescriptor = propertyDescriptor && propertyDescriptor.valueDescriptor;

            //console.log(objectDescriptor.name+": fetchObject:",object, "property:"+ " -"+propertyName);

            if(!Promise.is(valueDescriptor)) {
                valueDescriptor = Promise.resolve(valueDescriptor);
            }

            return valueDescriptor.then( function(valueDescriptor) {
                var mapping = objectDescriptor && self.mappingForType(objectDescriptor),
                    objectRule = mapping && mapping.objectMappingRules.get(propertyName),
                    snapshot = self.snapshotForObject(object),
                    objectRuleConverter = objectRule && objectRule.converter;


                // if(!snapshot) {
                //     throw "Can't fetchObjectProperty: type: "+valueDescriptor.name+" propertyName: "+propertyName+" - doesn't have a snapshot";
                // }


                /*
                    if we can get the value from the type's storage itself:
                    or
                    we don't have the foreign key necessary or it

                    -- !!! embedded values don't have their own snapshots --
                */
                if(
                    !valueDescriptor ||
                    ( valueDescriptor && !objectRuleConverter ) /*for Date for example*/ ||
                    ( valueDescriptor && objectRuleConverter && objectRuleConverter instanceof RawEmbeddedValueToObjectConverter) || (snapshot && !objectRule.hasRawDataRequiredValues(snapshot))
                ) {
                    var propertyNameQuery = DataQuery.withTypeAndCriteria(objectDescriptor,self.rawCriteriaForObject(object, objectDescriptor));

                    propertyNameQuery.readExpressions = [propertyName];

                    //console.log(objectDescriptor.name+": fetchObjectProperty "+ " -"+propertyName);

                    return self.fetchData(propertyNameQuery);

                } else {
                    return self._fetchObjectPropertyWithPropertyDescriptor(object, propertyName, propertyDescriptor);
                }
            });
        }
    },

    localizedReadExpressionForPropertyDescriptor: {
        value: function(propertyDescriptor) {
            //Need to formalize how we ge the right Locale from the user's stand point. For now, let's use
            /*
            Keywords like this overlap with the notation normally used for
            properties of this. If an object has a this property, you may use
            the notation .this, this.this, or this['this'].  .this is the
            normal form.
            var object = Bindings.defineBindings({
                "this": 10
            }, {
                that: {"<-": ".this"}
            });
            expect(object.that).toBe(object["this"]);
            */

            var language = Locale.systemLocale.language,
                region = Locale.systemLocale.region;
            return `${propertyDescriptor.name}[${language}][${region}] || ${propertyDescriptor.name}[${language}][*] || ${propertyDescriptor.name}[en][*]`;
        }
    },

    _mapObjectDescriptorReadExpressionToRawReadExpression: {
        value: function(objectDescriptor, readExpressions,rawReadExpressions) {
            var i, countI, iExpression, iRule, iPropertyDescriptor,
            mapping = this.mappingForType(objectDescriptor),
            rawDataMappingRules = mapping.rawDataMappingRules;

            for(i=0, countI = readExpressions && readExpressions.length;(i<countI);i++) {
                iExpression = readExpressions[i];
                rule = rawDataMappingRules.get(iExpression);
                propertyName = rule ? rule.sourcePath : iExpression;
                propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName);

                // if(propertyDescriptor && propertyDescriptor.isLocalizable) {
                //     rawReadExpressions.push(this.localizedReadExpressionForPropertyDescriptor(propertyDescriptor));

                // } else {
                    rawReadExpressions.push(iExpression);
                //}
            }
            return rawReadExpressions;
        }
    },

    _mapObjectDescriptorOrderingsToRawOrderings: {
        value: function(objectDescriptor, sortderings, rawOrderings) {
            throw new Error("_mapObjectDescriptorOrderingsToRawOrderings is not implemented");
        }
    },

    localesForObject: {
        value: function(object) {
            return object.locales || this.userLocales;
        }
    },

    _sharedCriteriaByLocales: {
        value: new Map()
    },


    sharedLocalesCriteriaForObject: {
        value: function(object) {
            var locales = this.localesForObject(object),
                sharedCriteriaForLocale = this._sharedCriteriaByLocales.get(locales);

            if(!sharedCriteriaForLocale) {
                this._sharedCriteriaByLocales.set(locales,(sharedCriteriaForLocale = new Criteria().initWithExpression("locales == $DataServiceUserLocales", {
                    DataServiceUserLocales: locales
                })));
            }

            return sharedCriteriaForLocale;
        }
    },

    localesCriteriaForObject: {
        value: function(object) {
            return new Criteria().initWithExpression("locales == $DataServiceUserLocales", {
                DataServiceUserLocales: this.localesForObject(object)
            });
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
                    criteriaWithLocale,
                    parameters,
                    rawParameters,
                    readOperation = new DataOperation(),
                    rawReadExpressions = [],
                    rawOrderings,
                    promises,
                    serializedOperation,
                    localizableProperties = objectDescriptor.localizablePropertyDescriptors;

                /*
                    We need to turn this into a Read Operation. Difficulty is to turn the query's criteria into
                    one that doesn't rely on objects. What we need to do before handing an operation over to another context
                    bieng a worker on the client side or a worker on the server side, is to remove references to live objects.
                    One way to do this is to replace every object in a criteria's parameters by it's data identifier.
                    Another is to serialize the criteria.
                */
                readOperation.type = DataOperation.Type.Read;
                readOperation.target = objectDescriptor;
                readOperation.data = {};

                //Need to add a check to see if criteria may have more spefific instructions for "locale".
                if(localizableProperties && localizableProperties.size) {
                    // var a = new Criteria().initWithExpression("locale == $locale", {
                    //     locale: this.userLocale
                    // });
                    // console.log(a.syntax);
                    // var b = new Criteria().initWithExpression("locale == $.locale", {
                    //     locale: this.userLocale
                    // });
                    // console.log(b.syntax);
                    // var c = new Criteria().initWithExpression("locale == $", this.userLocale);
                    // console.log(c.syntax);
                    // var d = new Criteria().initWithExpression("$key.has(id)", {"key":"123"});
                    // console.log(d.syntax);
                    // var e = new Criteria().initWithExpression("$.key.has(id)", {"key":"123"});
                    // console.log(e.syntax);
                    //var f = new Criteria().initWithExpression("$.has(id)", "123");
                    //console.log(JSON.stringify(f.syntax));

                    if(criteria) {
                        /*
                            WIP Adds locale as needed. Most common case is that it's left to the framework to qualify what Locale to use.

                            A core principle is that each data object (DO) has a locale property behaving in the following way:
                            locales has 1 locale value, a locale object.
                            This is the most common use case. The property’s getter returns the user’s locale.
                            Fetching an object with a criteria asking for a specific locale will return an object in that locale.
                            Changing the locale property of an object to another locale instance (singleton in Locale’s case), updates all the values of its localizable properties to the new locale set.
                            locales has either no value, or “*” equivalent, an “All Locale Locale”
                            This feches the json structure and returns all the values in all the locales
                            locales has an array of locale instances.
                            If locale’s cardinality is > 1 then each localized property would return a json/dictionary of locale->value instead of 1 value.
                        */

                        criteria = self.userLocalesCriteria.and(criteria);
                    } else {
                        criteria = self.userLocalesCriteria;
                    }
                }

                if(criteria) {
                    readOperation.criteria = criteria;
                }

                if(query.fetchLimit) {
                    readOperation.data.readLimit = query.fetchLimit;
                }

                if(query.sortderings && query.sortderings > 0) {
                    rawOrderings = [];
                    self._mapObjectDescriptorOrderingsToRawOrderings(objectDescriptor, query.sortderings,rawOrderings);
                    readOperation.data.orderings = rawOrderings;
                }

                /*
                    for a read operation, we already have criteria, shouldn't data contains the array of
                    expressions that are expected to be returned?
                */
                self._mapObjectDescriptorReadExpressionToRawReadExpression(objectDescriptor, query.readExpressions,rawReadExpressions);
                if(rawReadExpressions.length) {
                    readOperation.data.readExpressions = rawReadExpressions;
                }

                /*

                    this is half-assed, we're mapping full objects to RawData, but not the properties in the expression.
                    phront-service does it, but we need to stop doing it half way there and the other half over there.
                    SaveChanges is cleaner, but the job is also easier there.

                */
               parameters = criteria ? criteria.parameters : undefined;
               rawParameters = parameters;

                if(parameters && typeof criteria.parameters === "object") {
                    var keys = Object.keys(parameters),
                        i, countI, iKey, iValue, iRecord;

                    rawParameters = Array.isArray(parameters) ? [] : {};

                    for(i=0, countI = keys.length;(i < countI); i++) {
                        iKey  = keys[i];
                        iValue = parameters[iKey];
                        if(!iValue) {
                            throw "fetchData: criteria with no value for parameter key "+iKey;
                        } else {
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

                    }
                    // if(promises) promises = Promise.all(promises);
                }
                if(!promises) promises = Promise.resolve(true);
                promises.then(function() {
                    if(criteria) readOperation.criteria.parameters = rawParameters;
                    //console.log("fetchData operation:",JSON.stringify(readOperation));
                    self._dispatchReadOperation(readOperation, stream);
                    if(criteria) readOperation.criteria.parameters = parameters;

                });
            })
            .catch(function(error) {
                stream.dataError(error);
            });

          return stream;
        }
    },

    // _processObjectChangesForProperty: {
    //     value: function(object, aProperty, aPropertyDescriptor, aPropertyChanges, operationData, snapshot, dataSnapshot, rawDataPrimaryKeys, mapping) {
    //         var aRawProperty = mapping.mapObjectPropertyToRawProperty(object, aProperty);

    //         if(this._isAsync(aRawProperty)) {
    //             var self = this;
    //             return aRawProperty.then(function(aRawProperty) {
    //                 return self.__processObjectChangesForProperty(object, aProperty, aPropertyDescriptor, aRawProperty, aPropertyChanges, operationData, snapshot, dataSnapshot, rawDataPrimaryKeys);
    //             });
    //         } else {
    //             return this.__processObjectChangesForProperty(object, aProperty, aPropertyDescriptor, aRawProperty, aPropertyChanges, operationData, snapshot, dataSnapshot, rawDataPrimaryKeys);
    //         }

    //     }
    // },

    __processObjectChangesForProperty: {
        value: function(object, aProperty, aPropertyDescriptor, aPropertyChanges, operationData, lastReadSnapshot, rawDataSnapshot, rawDataPrimaryKeys, mapping) {

            /*
                We already do that in expression-data-mapping mapObjectPropertyToRawData(), but expression-data-mapping doesn't know about added/removed changes where our _processObjectChangesForProperty does.
            */
            // if(rawDataPrimaryKeys && rawDataPrimaryKeys.indexOf(aRawProperty) !== -1) {
            //     return;
            // }

            var self = this,
                aPropertyDeleteRule = aPropertyDescriptor ? aPropertyDescriptor.deleteRule : null;

            /*
                A collection with "addedValues" / "removedValues" keys
                Which for now we only handle for Arrays.

                The recent addition of a DataObject property that can be a Map, we may have to re-visit that. It would be better to handle incremental changes to a map than sending all keys and all values are we doing for now
            */
            if(aPropertyChanges && (aPropertyChanges.hasOwnProperty("addedValues") ||  aPropertyChanges.hasOwnProperty("removedValues"))) {
                if(!(aPropertyDescriptor.cardinality>1)) {
                    throw new Error("added/removed values for property without a to-many cardinality");
                }
            //     /*
            //         Until we get more sophisticated and we can leverage
            //         the full serialization, we turn objects into their primaryKey

            //         We have a partial view, the backend will need pay attention that we're not re-adding object if it's already there, and should be unique.
            //     */
            //    var valuesIterator, iValue, addedValues, removedValues;
            //    if(aPropertyChanges.addedValues) {

            //         /*
            //             Notes:
            //             If dataObject[aProperty] === null, we could treat addedValues as a set, and there might be something going on in tracking/propagating changes that leads to a set being considered as added. Triggers do their best to keep the array created in place, and change it's content rather than replace it, even when a set is done. That in itself is likely the reason we see this.

            //             There might not be downsides to deal with it as an add though.
            //         */
            //         valuesIterator = aPropertyChanges.addedValues.values();
            //         while ((iValue = valuesIterator.next().value)) {
            //             (addedValues || (addedValues = [])).push(this.dataIdentifierForObject(iValue).primaryKey);
            //         }

            //         /*
            //             After converting to primaryKeys in an array, we make it replace the original set for the same key on aPropertyChanges
            //         */
            //        if(addedValues) {
            //             aPropertyChanges.addedValues = addedValues;
            //        } else {
            //            delete aPropertyChanges.addedValues;
            //        }
            //    }

            //     if(aPropertyChanges.removedValues) {
            //         valuesIterator = aPropertyChanges.removedValues.values();
            //         while ((iValue = valuesIterator.next().value)) {
            //             //TODO: Check if the removed value should be itself be deleted
            //             //if(aPropertyDeleteRule === DeleteRule.CASCADE){}
            //             (removedValues || (removedValues = [])).push(this.dataIdentifierForObject(iValue).primaryKey);
            //         }
            //         if(removedValues) {
            //             aPropertyChanges.removedValues = removedValues;
            //         } else {
            //             delete aPropertyChanges.removedValues;
            //         }
            //     }

            //     //Here we mutated the structure from changesForDataObject. I should be cleared
            //     //when saved, but what if save fails and changes happen in-between?
            //     operationData[aRawProperty] = aPropertyChanges;

                return this._mapObjectPropertyToRawData(object, aProperty, operationData, undefined/*context*/, aPropertyChanges.addedValues, aPropertyChanges.removedValues, lastReadSnapshot, rawDataSnapshot);

            }
            else {
                return this._mapObjectPropertyToRawData(object, aProperty, operationData, undefined/*context*/,undefined, undefined, lastReadSnapshot, rawDataSnapshot);

                /*
                    we need to check post mapping that the rawValue is different from the snapshot
                */
                // if (this._isAsync(result)) {
                //     return result.then(function (value) {
                //         self._setOperationDataSnapshotForProperty(operationData, snapshot, dataSnapshot, aRawProperty );
                //     });
                // }
                // else {
                //     self._setOperationDataSnapshotForProperty(operationData, snapshot, dataSnapshot, aRawProperty );
                // }
            }
        }
    },

    // _setOperationDataSnapshotForProperty: {
    //     value: function(operationData, snapshot, dataSnapshot, aRawProperty ) {
    //         if(snapshot.hasOwnProperty(aRawProperty)) {
    //             if(snapshot[aRawProperty] === operationData[aRawProperty]) {
    //                 delete operationData[aRawProperty];
    //                 delete snapshot[aRawProperty];
    //             }
    //             else {
    //                 dataSnapshot[aRawProperty] = snapshot[aRawProperty];
    //             }
    //         }

    //     }
    // },

    primaryKeyForNewDataObject: {
        value: function (type) {
            //return Phluid.generate(this.mappingForType(type).rawDataTypeId);
            return uuid.generate();
        }
    },

    fetchRawDataTypeIds: {
        value: function() {
            //kind == "r" are tables. Needs to bake that as an rawDataTypeExpression
            //in a PGTable subclass's mapping
            var criteria = new Criteria().initWithExpression("kind == 'r' && namespace.name = 'phront'");
            var query = DataQuery.withTypeAndCriteria(PGClass, criteria);

            return this.fetchData(query)
            .then(function(result) {
                if(result) {
                    var i, countI, iTable, iTableName, iOID;

                    for(i=0, countI = result.length;(i<countI); i++) {
                        iTable = result[i];
                        iTableName = iTable.name;
                        iOID = iTable.iOID;
                    }
                }
            });

        }
    },

    _rawDataTypeIdByObjectDescriptor: {
        value: undefined
    },

    rawDataTypeIdByObjectDescriptorPromise: {
        value: function () {
            return uuid.generate();
        }
    },


    /**
     * We're going to assign types/ObjectDescriptor a unique rawDataTypeId, 4 bytes value.
     * We're starting simple with CRC32c derived from
     *
     * Montage.getInfoForObject(objectDescriptor).require.getModuleDescriptor(objectDescriptor.module.id).display
     *
     * calculated in meomory and later on will store in a table/registry to guarantee unicity across the 2^32 values
     *
     * @method
     * @argument {RawDataService} service
     * @argument {Array} [types] Types to use instead of the child's types.
     */

    rawDataTypeIdForObjectDescriptor: {
        value: function (objectDescriptor) {
            var info = Montage.getInfoForObject(objectDescriptor);
            return this.rawDataTypeIdByObjectDescriptor(objectDescriptor) /*|| ()*/;
        }
    },

    rawDataTypeIdForMapping: {
        value: function (aMapping) {
            return this.rawDataTypeIdForObjectDescriptor(aMapping.objectDescriptor);
        }
    },


    handleCreateTransactionCompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },
    handleCreateTransactionFailed: {
        value: function (operation) {
            this.handleOperationFailed(operation);
        }
    },
    handleBatchCompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },
    handleBatchFailed: {
        value: function (operation) {
            this.handleOperationFailed(operation);
        }
    },
    handlePerformTransactionCompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },
    handlePerformTransactionFailed: {
        value: function (operation) {
            this.handleOperationFailed(operation);
        }
    },
    handleRollbackTransactionCompleted: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },
    handleRollbackTransactionFailed: {
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
                return objectInvalidityStates;
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

    _saveDataOperationsForObjects: {
        value: function(objects, operationType, dataObjectChangesMap, dataOperationsByObject) {
            var self = this;
            return new Promise(function(resolve, reject) {
                var iterator = objects.values(),
                isUpdateOperationType = operationType === DataOperation.Type.Update,
                iOperationPromises,
                iOperationPromise,
                operations,
                iObject;

                while(iObject = iterator.next().value) {
                    iOperationPromise = self._saveDataOperationForObject(iObject, operationType, dataObjectChangesMap, dataOperationsByObject);
                    (iOperationPromises || (iOperationPromises = [])).push(iOperationPromise);
                    iOperationPromise.then(function(resolvedOperation) {
                        /*
                            NoOps will be handled by iterating on dataObjectChangesMap later on
                        */
                        if(resolvedOperation.type !== DataOperation.Type.NoOp) {
                            (operations || (operations = [])).push(resolvedOperation);
                        }
                    }, function(rejectedValue) {
                        reject(rejectedValue);
                    });
                }

                if(iOperationPromises) {

                    Promise.all(iOperationPromises)
                    .then(function(resolvedOperations) {
                        /*
                            resolvedOperations could contains some null if changed objects don't have anything to solve in their own row because it's stored on the other side of a relationship, which is why we keep track of the other array ourselves to avoid looping over again and modify the array after, or send noop operation through the wire for nothing. Cost time an money!
                        */
                    resolve(operations);
                    }, function(rejectedValue) {
                        reject(rejectedValue);
                    });

                } else {
                    resolve(null);
                }

            });
        }
    },

    _pendingTransactions: {
        value: undefined
    },
    addPendingTransaction: {
        value: function(aCreateTransactionOperation) {
            (this._pendingTransactions || (this._pendingTransactions = [])).push(aCreateTransactionOperation);
        }
    },
    deletePendingTransaction: {
        value: function(aCreateTransactionOperation) {
            if(this._pendingTransactions) {
                this._pendingTransactions.delete(aCreateTransactionOperation);
            }
        }
    },

    isObjectCreated: {
        value: function(object) {
            var pendingTransactions = this._pendingTransactions;

            if(pendingTransactions && pendingTransactions.length) {
                for(var i=0, countI = pendingTransactions.length; (i < countI); i++ ) {
                    if(pendingTransactions[i].createdDataObjects.has(object)) {
                        return true;
                    }
                }
                return false;
            } else {
                return false;
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
                        transactionObjectDescriptorArray,
                        batchOperation,
                        batchedOperationPromises,
                        transactionOperations,
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
                        createTransactionCompletedId;



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

                    //we assess createdDataObjects's validity:
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
                    .then(function(_transactionObjectDescriptors) {
                        var iterator, iOperation;


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
                        batchedOperationPromises.push(self._saveDataOperationsForObjects(createdDataObjects, createOperationType, dataObjectChanges, dataOperationsByObject));
                        // iterator = createdDataObjects.values();
                        // while(iObject = iterator.next().value) {
                        //     batchedOperationPromises.push(self._saveDataOperationForObject(iObject, createOperationType, dataObjectChanges, dataOperationsByObject));
                        // }

                        //Loop over changedDataObjects:
                        batchedOperationPromises.push(self._saveDataOperationsForObjects(changedDataObjects, updateOperationType, dataObjectChanges, dataOperationsByObject));
                        // iterator = changedDataObjects.values();
                        // while(iObject = iterator.next().value) {
                        //     batchedOperationPromises.push(self._saveDataOperationForObject(iObject, updateOperationType, dataObjectChanges, dataOperationsByObject));
                        // }

                        //And complete by deletedDataObjects:
                        batchedOperationPromises.push(self._saveDataOperationsForObjects(deletedDataObjects, deleteOperationType, dataObjectChanges, dataOperationsByObject));
                        // iterator = deletedDataObjects.values();
                        // while(iObject = iterator.next().value) {
                        //     batchedOperationPromises.push(self._saveDataOperationForObject(iObject, deleteOperationType, dataObjectChanges, dataOperationsByObject));
                        // }

                        return Promise.all(batchedOperationPromises)
                            .then(function(operationsByTypes) {
                                console.log("PhrontClientService: saveChanges - operations created");
                                var result,
                                    createOperations = operationsByTypes[0],
                                    updateOperations = operationsByTypes[1],
                                    deleteOperations = operationsByTypes[2];

                                if(createOperations) {
                                    result = createOperations;
                                }
                                if(!result) {
                                    if(updateOperations) {
                                        result = updateOperations;
                                    }
                                } else {
                                    result.push.apply(result,updateOperations);
                                }

                                if(!result) {
                                    if(deleteOperations) {
                                        result = deleteOperations;
                                    }
                                } else {
                                    result.push.apply(result,deleteOperations);
                                }

                                transactionOperations = result;
                                return result;
                            });

                    }, function(error) {
                        self.deletePendingTransaction(createTransaction);
                        reject(error);
                    })

                    .then(function(batchedOperations) {
                        //Now that all objects are valid we can proceed and kickstart a transaction as it needs to do the round trip
                        //We keep the promise and continue to prepare the work.
                        return self._socketOpenPromise.then(function () {

                            var _createTransactionPromise;

                            createTransaction = new DataOperation();
                            createTransaction.type = DataOperation.Type.CreateTransaction;

                            /*
                                createTransaction.target = DataService.mainService;

                                Workaround until we get the serialization/deserialization to work with an object passed with a label that is pre-existing and passed to both the serialiaer and deserializer on each side.

                                So until then, if target is null, it's meant for the coordinaator, needed for transactions that could contain object descriptors that are handled by different data services and the OperationCoordinator will have to handle that himself first to triage, before distributing to the relevant data services by creating nested transactions with the subset of dataoperations/types they deal with.
                            */
                            createTransaction.target = DataService.mainService;
                            createTransaction.data = transactionObjectDescriptors.map((objectDescriptor) => {return objectDescriptor.module.id});

                            _createTransactionPromise = new Promise(function(resolve, reject) {
                                createTransaction._promiseResolve = resolve;
                                createTransaction._promiseReject = reject;
                            });
                            self._thenableByOperationId.set(createTransaction.id,_createTransactionPromise);


                            //Bookeeping for client side:
                            createTransaction.createdDataObjects = createdDataObjects;
                            createTransaction.changedDataObjects = changedDataObjects;
                            createTransaction.deletedDataObjects = deletedDataObjects;
                            createTransaction.dataObjectChanges = dataObjectChanges;

                            self.addPendingTransaction(createTransaction);

                            self._dispatchOperation(createTransaction);

                            return _createTransactionPromise;
                        }, function(error) {
                            console.error("Error trying to communicate with server",error);
                            self.deletePendingTransaction(createTransaction);
                            reject(error);
                        });

                    }, function(error) {
                        self.deletePendingTransaction(createTransaction);
                        reject(error);
                    })
                    .then(function(createTransactionResult) {

                        if(createTransactionResult.type === DataOperation.Type.CreateTransactionFailed) {
                            var error = new Error("CreateTransactionFailed");
                            error.details = createTransactionResult;
                            self.deletePendingTransaction(createTransaction);
                            return reject(error);
                        }

                        //createTransactionCompletedId = createTransactionResult.data.transactionId;
                        createTransactionCompletedId = createTransactionResult.id;
                        console.log("PhrontClientService saveChanges: createTransactionCompletedId is "+createTransactionCompletedId);

                        if(transactionOperations) {
/*
                            var batchedOperationsPromises = [], maxBatchSize = 10,
                                i, countI, iBatch;


                            for(i=0; (i<batchedOperations.length); i++ ) {

                                if(maxBatchSize > batchedOperations.length) {
                                    iBatch = batchedOperations;
                                } else {
                                    iBatch = batchedOperations.splice(i, maxBatchSize);
                                }

                                //Now proceed to build the batch operation
                                //We may have some no-op in there as we didn't cacth them...
                                batchOperation = new DataOperation();
                                batchOperation.type = DataOperation.Type.Batch;

                                //This is to target the OperationCoordinator on the other side
                                batchOperation.target = DataService.mainService;
                                //batchOperation.target = (transactionObjectDescriptors.size === 1) ? Array.from(transactionObjectDescriptors)[0] : null;
                                // batchOperation.target = (transactionObjecDescriptors.length === 1) ? transactionObjecDescriptors[0] : transactionObjecDescriptors;
                                batchOperation.data = {
                                        batchedOperations: iBatch,
                                        transactionId: createTransactionCompletedId
                                };
                                batchOperation.referrerId = createTransaction.id;

                                batchOperationPromise = new Promise(function(resolve, reject) {
                                    batchOperation._promiseResolve = resolve;
                                    batchOperation._promiseReject = reject;
                                });
                                self._thenableByOperationId.set(batchOperation.id,batchOperationPromise);

                                batchedOperationsPromises.push(batchOperationPromise);
                                self._dispatchOperation(batchOperation);

                            }
                            return Promise.all(batchedOperationsPromises);

                            */


                            //Now proceed to build the batch operation
                            //We may have some no-op in there as we didn't cacth them...
                            batchOperation = new DataOperation();
                            batchOperation.type = DataOperation.Type.Batch;

                            //This is to target the OperationCoordinator on the other side
                            batchOperation.target = DataService.mainService;
                            //batchOperation.target = (transactionObjectDescriptors.size === 1) ? Array.from(transactionObjectDescriptors)[0] : null;
                            // batchOperation.target = (transactionObjecDescriptors.length === 1) ? transactionObjecDescriptors[0] : transactionObjecDescriptors;
                            batchOperation.data = {
                                    batchedOperations: transactionOperations,
                                    transactionId: createTransactionCompletedId
                            };
                            batchOperation.referrerId = createTransaction.id;

                            batchOperationPromise = new Promise(function(resolve, reject) {
                                batchOperation._promiseResolve = resolve;
                                batchOperation._promiseReject = reject;
                            });
                            self._thenableByOperationId.set(batchOperation.id,batchOperationPromise);

                            self._dispatchOperation(batchOperation);

                            return batchOperationPromise;

                        } else {
                            var noOpOperation = new DataOperation();
                            noOpOperation.type = DataOperation.Type.NoOp;
                            self.deletePendingTransaction(createTransaction);
                            return Promise.resolve(noOpOperation);
                        }
                    }, function(error) {
                        self.deletePendingTransaction(createTransaction);
                        reject(error);
                    })
                    .then(function(batchedOperationResult) {

                        if(batchedOperationResult.type === DataOperation.Type.BatchCompleted) {
                            //We proceed to commit:
                            performTransactionOperation = new DataOperation();
                            performTransactionOperation.type = DataOperation.Type.PerformTransaction;
                            performTransactionOperation.target = DataService.mainService;
                            //Not sure we need any data here?
                            //performTransactionOperation.data = batchedOperations;

                            //The createTransactionCompleted.id is the backend transacionId we need.
                            //It would also make sense to treat the referrerId of the performTransactionOperation
                            //to be the id of the createTransactionCompleted that preceded it.
                            performTransactionOperation.referrerId = createTransaction.id;
                            performTransactionOperation.data = {
                                transactionId: createTransactionCompletedId
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
                            rollbackTransactionOperation.target = createTransaction.target,
                            //Not sure we need any data here?
                            // rollbackTransactionOperation.data = batchedOperations;
                            rollbackTransactionOperation.referrerId = createTransaction.id;
                            rollbackTransactionOperation.data = {
                                transactionId: createTransaction.id
                            };

                            rollbackTransactionOperationPromise = new Promise(function(resolve, reject) {
                                rollbackTransactionOperation._promiseResolve = resolve;
                                rollbackTransactionOperation._promiseReject = reject;
                            });
                            self._thenableByOperationId.set(rollbackTransactionOperation.id,rollbackTransactionOperationPromise);

                            self._dispatchOperation(rollbackTransactionOperation);

                            return rollbackTransactionOperationPromise;

                        } if(batchedOperationResult.type === DataOperation.Type.NoOp) {
                            return Promise.resolve(batchedOperationResult);
                        } else {
                            console.error("- saveChanges: Unknown batchedOperationResult:",batchedOperationResult);
                            self.deletePendingTransaction(createTransaction);
                            reject(new Error("- saveChanges: Unknown batchedOperationResult:"+JSON.stringify(batchedOperationResult)));
                        }
                    }, function(error) {
                        self.deletePendingTransaction(createTransaction);
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
                        } else if(transactionOperationResult.type === DataOperation.Type.NoOp) {
                            console.error("NoOp");
                        } else {
                            console.error("- saveChanges: Unknown transactionOperationResult:",transactionOperationResult);

                            self.deletePendingTransaction(createTransaction);
                            reject(new Error("- saveChanges: Unknown transactionOperationResult:"+JSON.stringify(transactionOperationResult)));
                        }

                        self.deletePendingTransaction(createTransaction);
                        resolve(transactionOperationResult);

                    }, function(error) {
                        self.deletePendingTransaction(createTransaction);
                        reject(error);
                    });

                }
                catch (error) {
                    self.deletePendingTransaction(createTransaction);
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
                iObjectDescriptor = iOperation.target;
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
     * Map the properties of an object that have changed to be included as data in a DataOperation
     *
     * @method
     * @argument {Object} object - The object whose data should be saved.
     * @argument {DataOperation.Type} operationType - The object whose data should be saved.
     * @returns {external:Promise} - A promise fulfilled to operationData when mapping is done.
     *
     */
    _mapObjectChangesToOperationData: {
        value: function (object, dataObjectChanges, operationData, snapshot, dataSnapshot, isDeletedObject, objectDescriptor) {
            var aProperty,
                aRawProperty,
                // snapshotValue,
                anObjectDescriptor = objectDescriptor || this.objectDescriptorForObject(object),
                aPropertyChanges,
                aPropertyDescriptor,
                result,
                mappingPromise,
                mappingPromises,
                /*
                    There's a risk here for a deletedObject that it's values have been changed and therefore wouldn't match what was fetched. We need to test that.

                    #TODO TEST maybe we don't need the isDeletedObject flag as deletedObjects shouldn't have ataObjectChanges.

                    But we need to implemement cascade delete.
                */
                propertyIterator = isDeletedObject
                    ? Object.keys(object).values()
                    : dataObjectChanges.keys(),
                mapping = this.mappingForType(anObjectDescriptor),
                rawDataPrimaryKeys = mapping.rawDataPrimaryKeys;

            while(aProperty = propertyIterator.next().value) {
                // aRawProperty = mapping.mapObjectPropertyNameToRawPropertyName(aProperty);
                //aRawProperty = mapping.mapObjectPropertyToRawProperty(object, aProperty);


                // snapshotValue = snapshot[aRawProperty];
                aPropertyChanges = dataObjectChanges ? dataObjectChanges.get(aProperty) : undefined;
                aPropertyDescriptor = anObjectDescriptor.propertyDescriptorForName(aProperty);

                //For delete, we're looping over Object.keys(object), which may contain properties that aren't
                //serializable. Ourr goal for delete is to use these values for optimistic locking, so no change, no need
                //If we pass this down to _processObjectChangesForProperty, it will attempt to map and fail if no aPropertyDescriptor
                //exists. So we catch it here since we know the context about the operation.
                if(isDeletedObject && (!aPropertyDescriptor || !aPropertyChanges)) {
                    continue;
                }

                result = this.__processObjectChangesForProperty(object, aProperty, aPropertyDescriptor, aPropertyChanges, operationData, snapshot, dataSnapshot, rawDataPrimaryKeys, mapping);

                if(result && this._isAsync(result)) {
                    (mappingPromises || (mappingPromises = [])).push(result);
                }
            }

            if(mappingPromises && mappingPromises.length) {
                mappingPromise = Promise.all(mappingPromises);
            }


            return (mappingPromise
                ? mappingPromise.then(function() {
                    return operationData;
                })
                : Promise.resolve(operationData))


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
                    //We make a shallow copy so we can remove properties we don't care about
                    snapshot = Object.assign({},object.dataIdentifier && this.snapshotForDataIdentifier(object.dataIdentifier)),
                    dataSnapshot = {},
                    dataObjectChanges = dataObjectChangesMap.get(object),
                    propertyIterator,
                    isNewObject = operationType
                        ? operationType === DataOperation.Type.Create
                        : self.rootService.isObjectCreated(object),
                    localOperationType = operationType
                                        ? operationType
                                        : isNewObject
                                            ? DataOperation.Type.Create
                                            : DataOperation.Type.Update,
                    isDeletedObject = localOperationType === DataOperation.Type.Delete,
                    operationData = {},
                    localizableProperties = objectDescriptor.localizablePropertyDescriptors,
                    criteria,
                    i, iValue, countI;

                operation.target = objectDescriptor;

                operation.type = localOperationType;

                if(dataIdentifier) {
                    if(!isNewObject) {
                        criteria = this.rawCriteriaForObject(object, objectDescriptor);
                    }
                    else {
                        operationData.id = dataIdentifier.primaryKey;
                    }
                }

                if(localizableProperties && localizableProperties.size) {
                    if(criteria) {
                        criteria = this.localesCriteriaForObject(object).and(criteria);
                    } else {
                        //Even in a create, we need to know about locales
                        // criteria = this.sharedLocalesCriteriaForObject(object);
                        criteria = this.localesCriteriaForObject(object);
                    }
                }

                operation.criteria = criteria;

                //Nothing to do, change the operation type and bail out
                if(!isNewObject && !dataObjectChanges && !isDeletedObject) {
                    operation.type = DataOperation.Type.NoOp;
                    return Promise.resolve(operation);
                }

                operation.data = operationData;


                /*
                    The last fetched values of the properties that changed, so the backend can use it to make optimistic-locking update
                    with a where that conditions that the current value is still
                    the one that was last fecthed by the client making the update.

                    For deletedObjects, if there were changes, we don't care about them, it's not that relevant, we're going to use all known properties fetched client side to eventually catch a conflict if someone made a change in-between.
                */
                if(!isNewObject) {
                    operation.snapshot = dataSnapshot;
                }

                return this._mapObjectChangesToOperationData(object,dataObjectChanges,operationData, snapshot, dataSnapshot,isDeletedObject, objectDescriptor)
                    .then(function(resolvedOperationData) {

                        if(!isDeletedObject && Object.keys(operationData).length === 0) {
                            /*
                                if there are no changes known, it's a no-op: if it's an existing object nothing to do and if it's a new empty object... should it go through?? Or it's either a CreateCancelled or an UpdateCancelled.

                                It also can be considered a no-op of a property on an object changes, but it is stored as a foreign key or in an array of foreign keys on the inverse relationship side, in which case, there's nothing to do, as thanks to inverse value propagation, it will become an update operation on the other side.
                            */

                            operation.type = DataOperation.Type.NoOp;
                            /*
                                If a property change would turn as a no-op from a raw data stand point, we still need to tell the object layer client of the saveChanges did save it
                            */
                            operation.changes = dataObjectChanges;
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
                    // mapping = this.mappingForType(objectDescriptor),
                    // //We make a shallow copy so we can remove properties we don't care about
                    // snapshot = Object.assign({},object.dataIdentifier && this.snapshotForDataIdentifier(object.dataIdentifier)),
                    // dataSnapshot = {},
                    // snapshotValue,
                    // dataObjectChanges = this.rootService.changesForDataObject(object),
                    // changesIterator,
                    // aProperty, aRawProperty,
                    // isNewObject = self.rootService.isObjectCreated(object),
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
                                objectDescriptor = operation.target,
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
    //             mapping = this.mappingForType(objectDescriptor),
    //             //We make a shallow copy so we can remove properties we don't care about
    //             snapshot = Object.assign({},object.dataIdentifier && this.snapshotForDataIdentifier(object.dataIdentifier)),
    //             dataSnapshot = {},
    //             snapshotValue,
    //             dataObjectChanges = this.rootService.changesForDataObject(object),
    //             changesIterator,
    //             aProperty, aRawProperty,
    //             isNewObject = self.rootService.isObjectCreated(object),
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
    //                 isNewObject = self.rootService.isObjectCreated(object),
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
            error = operation.data;


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
    }



});
