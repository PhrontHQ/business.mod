var DataService = require("mod/data/service/data-service").DataService,
    RawDataService = require("mod/data/service/raw-data-service").RawDataService,
    //DataQuery = (require) ("mod/data/model/data-query").DataQuery,
    Promise = require("mod/core/promise").Promise,
    evaluate = require("mod/core/frb/evaluate"),
    Set = require("mod/core/collections/set"),
    Map = require("mod/core/collections/map"),
    MontageSerializer = require("mod/core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("mod/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    DataOperation = require("mod/data/service/data-operation").DataOperation,
    //We don't use special Ids yet, when/if we do, the goal would be to avoid collision and maybe encode more data like the type in it.
    // Phluid = (require) ("./phluid").Phluid,
    WebSocket = require("mod/core/web-socket").WebSocket,
    defaultEventManager = require("mod/core/event/event-manager").defaultEventManager,
    //RawEmbeddedValueToObjectConverter = (require) ("mod/data/converter/raw-embedded-value-to-object-converter").RawEmbeddedValueToObjectConverter,
    //ReadEvent = (require) ("mod/data/model/read-event").ReadEvent,
    BytesConverter = require("mod/core/converter/bytes-converter").BytesConverter,
    WebSocketSession = require("../model/app/web-socket-session").WebSocketSession,
    sizeof = require('object-sizeof'),
    currentEnvironment = require("mod/core/environment").currentEnvironment,
    isMod = ((currentEnvironment.stage === "mod" ||
    currentEnvironment.stage === "local"));


var Identity = require("mod/data/model/identity").Identity;

//Set our DataTrigger custom subclass:
//DataService.prototype.DataTrigger = DataTrigger;


/**
* TODO: Document
*
* @class
* @extends RawDataService
*/
exports.AWSAPIGatewayWebSocketDataOperationService = AWSAPIGatewayWebSocketDataOperationService = RawDataService.specialize(/** @lends AWSAPIGatewayWebSocketDataOperationService.prototype */ {
    constructor: {
        value: function AWSAPIGatewayWebSocketDataOperationService() {
            var self = this;

            this._failedConnections = 0;
            this.super();

            this.addOwnPropertyChangeListener("mainService", this);

            //this._serializer = new MontageSerializer().initWithRequire(require);
            this._serializer = new MontageSerializer().initWithRequire(global.require);
            this._deserializer = new Deserializer();

            this._readOperationQueue = [];

            return this;
        }
    },

    supportsTransaction: {
        value: true
    },

    usePerformTransaction: {
        value: true
    },

    handleMainServiceChange: {
        value: function (mainService) {
            //That only happens once
            if(mainService) {

                /*

                    here we're preparing to listen for DataOperations we will get from the stack, but:
                        - we're getting DataEvent "create", sent by DataService when an object is created in-memory that we don't care about
                        - If there are other raw data services handling other types, we're going to get some operations that we don't want to handle.
                        - So being a listener of mainService is too wide
                            - we should be listening for

                */

                /*
                    DataOperations on their way out:
                */

                // this.addEventListener(DataOperation.Type.ReadOperation,this,false);
                this.addEventListener(DataOperation.Type.UpdateOperation,this,false);
                this.addEventListener(DataOperation.Type.CreateOperation,this,false);
                this.addEventListener(DataOperation.Type.DeleteOperation,this,false);
                this.addEventListener(DataOperation.Type.PerformTransactionOperation,this,false);
                this.addEventListener(DataOperation.Type.CreateTransactionOperation,this,false);
                this.addEventListener(DataOperation.Type.AppendTransactionOperation,this,false);
                this.addEventListener(DataOperation.Type.CommitTransactionOperation,this,false);
                this.addEventListener(DataOperation.Type.RollbackTransactionOperation,this,false);


                /*
                    DataOperation coming back with a referrer, we listen on ouselves
                */
                mainService.addEventListener(DataOperation.Type.NoOp,this,false);
                // mainService.addEventListener(DataOperation.Type.ReadFailedOperation,this,false);
                // mainService.addEventListener(DataOperation.Type.ReadCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.UpdateFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.UpdateCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.DeleteFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.DeleteCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateTransactionFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateTransactionCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.BatchCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.BatchFailedOperation,this,false);

                mainService.addEventListener(DataOperation.Type.ChangeFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.PerformTransactionCompletedOperation,this,false);

                mainService.addEventListener(DataOperation.Type.TransactionUpdatedOperation,this,false);

                mainService.addEventListener(DataOperation.Type.AppendTransactionCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.AppendTransactionFailedOperation,this,false);

                mainService.addEventListener(DataOperation.Type.CommitTransactionFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CommitTransactionCompletedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.RollbackTransactionFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.RollbackTransactionCompletedOperation,this,false);

            }
        }
    },

    __socketOpenPromise: {
        value: undefined
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
                var stage = currentEnvironment.stage || "live",
                    connection = this.connectionForIdentifier(stage),
                        websocketURL;

                if(global.location) {
                    if(stage === "mod" || global.location.hostname === "127.0.0.1" || global.location.hostname === "localhost" || global.location.hostname.endsWith(".local") ) {
                        websocketURL = new URL(connection.websocketURL);

                        if(global.location.hostname === "localhost" && currentEnvironment.isAndroidDevice && websocketURL.hostname.endsWith(".local")) {
                            websocketURL.hostname = "localhost";
                            websocketURL.port = Number(websocketURL.port)+1;
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
            var applicationIdentity = this.application.identity,
                session = new WebSocketSession(),
                serializedSession,
                base64EncodedSerializedSession;


            /*
                TEMPORARY FIXME
                hard-coding applicationId and applicationCredentials to run some tests.

                THIS WILL NOT BE USED BY CLIENT SIDE APP

            */
        //    {
        //     var identity = new Identity/* Identity */
        //     identity.applicationIdentifier = "3bht9ellqo8j90krq0kpklf7mm";
        //     identity.applicationCredentials = "881t5di0qtlmap7s6hge6hj4tv45r9heom9o5vugu8u179sv60h";
        //     applicationIdentity = identity;
        //    }



            if(applicationIdentity) {
                session.identity = applicationIdentity;
            }

            try {

                serializedSession = this._serializer.serializeObject(session);
                base64EncodedSerializedSession = btoa(serializedSession);

            } catch(error) {
                console.error(error);
                throw error;
            }


            this._socket = new WebSocket(this.connection.websocketURL+"?session="+base64EncodedSerializedSession);

            //The maxTimeOut of AWS API Gateway.
            this._socket.reconnectionInterval = this.reconnectionInterval;

            this._socket.addEventListener("open", this);
            this._socket.addEventListener("error", this);
            this._socket.addEventListener("close", this);
            this._socket.addEventListener("message", this);

        }
    },

    reconnectionInterval: {
        value: 29000
    },

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

    handleClose: {
        value: function (event) {
            console.log("WebSocket closed with message:",event);
            /*
            this._failedConnections++;
            if (this._failedConnections > 5) {
                // The token we're trying to use is probably invalid, force
                // sign in again
                window.location.reload();
            }
            */
            //this._stopHeartbeat();
        }
    },


    // fetchObjectProperty: {
    //     value: function (object, propertyName) {
    //         var self = this,
    //             objectDescriptor = this.objectDescriptorForObject(object),
    //             propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName),
    //             valueDescriptor = propertyDescriptor && propertyDescriptor.valueDescriptor,
    //             isObjectCreated = this.isObjectCreated(object);

    //         //console.log(objectDescriptor.name+": fetchObject:",object, "property:"+ " -"+propertyName);

    //         if(!Promise.is(valueDescriptor)) {
    //             valueDescriptor = Promise.resolve(valueDescriptor);
    //         }

    //         return valueDescriptor.then( function(valueDescriptor) {
    //             var mapping = objectDescriptor && self.mappingForType(objectDescriptor),
    //                 objectRule = mapping && mapping.objectMappingRuleForPropertyName(propertyName),
    //                 snapshot = self.snapshotForObject(object),
    //                 objectRuleConverter = objectRule && objectRule.converter;


    //             // if(!snapshot) {
    //             //     throw "Can't fetchObjectProperty: type: "+valueDescriptor.name+" propertyName: "+propertyName+" - doesn't have a snapshot";
    //             // }


    //             /*
    //                 if we can get the value from the type's storage itself:
    //                 or
    //                 we don't have the foreign key necessary or it

    //                 -- !!! embedded values don't have their own snapshots --
    //             */
    //             if(
    //                 (!valueDescriptor && !objectRuleConverter) ||
    //                 ( valueDescriptor && !objectRuleConverter ) /*for Date for example*/ ||
    //                 ( valueDescriptor && objectRuleConverter && objectRuleConverter instanceof RawEmbeddedValueToObjectConverter) || (snapshot && !objectRule.hasRawDataRequiredValues(snapshot))
    //             ) {
    //                 var propertyNameQuery = DataQuery.withTypeAndCriteria(objectDescriptor,self.rawCriteriaForObject(object, objectDescriptor));

    //                 propertyNameQuery.readExpressions = [propertyName];

    //                 //console.log(objectDescriptor.name+": fetchObjectProperty "+ " -"+propertyName);

    //                 return DataService.mainService.fetchData(propertyNameQuery);

    //                 /*
    //                     Original from PhrontClient who was overriding fetchData
    //                 */
    //                 return self.fetchData(propertyNameQuery);

    //             } else {
    //                 return self._fetchObjectPropertyWithPropertyDescriptor(object, propertyName, propertyDescriptor,isObjectCreated);
    //             }
    //         });
    //     }
    // },

    /**
    * handle events/messages from the socket, turns them to operations and dispatch to rest of the app
    *
    * @method
    * @argument {Event} event
    */

    handleMessage: {
        value: function (event) {
            var serializedOperation;
            //console.log("received socket message ",event);
                serializedOperation = event.data;


            if(serializedOperation) {
                var deserializedOperation,
                operationPromise,
                objectRequires,
                module,
                isSync = false;

                /*

                    Sample:

                    '{"type":"message","data":"{\\"message\\": \\"Internal server error\\", \\"connectionId\\":\\"J8VDPdN7PHcCHnw=\\", \\"requestId\\":\\"J8VDgEAmvHcFueQ=\\"}"}'

                    When we get this, it's typically a timeout error


                */

                if(serializedOperation.indexOf('{"message": "Internal server error"') === 0) {
                     console.warn(event.data);
                } else {
                    try {
                        this._deserializer.init(serializedOperation, require, objectRequires, module, isSync);
                        operationPromise = this._deserializer.deserializeObject();
                    } catch (e) {
                        //Happens when serverless infra hasn't been used in a while:
                        //TODO: apptempt at least 1 re-try
                        //event.data: "{"message": "Internal server error", "connectionId":"HXT_RfBnPHcCIIg=", "requestId":"HXUAmGGZvHcF33A="}"

                        return console.error("Invalid Operation Serialization:", e, event.data);
                    }
                }

                if(operationPromise) {
                    var self = this;
                    operationPromise.then(function(operation) {
                        // if(operation.type === "readCompletedOperation" || operation.type === "readUpdateOperation") {
                        //         console.debug("readCompletedOperation: ",operation.data);
                        // }
                        //operation.target = self;
                        defaultEventManager.handleEvent(operation);
                    })
                }

                // if(operation) {
                //     var type = operation.type,
                //         operationListenerMethod = this._operationListenerNameForType(type);

                //     if(typeof this[operationListenerMethod] !== "function") {
                //         console.error("Implementation for "+operationListenerMethod+" is missing");
                //     }
                //     else {
                //         this[operationListenerMethod](operation);
                //     }

                //     /*
                //         Now that the distribution is done, we cleanup the matching:
                //             this._pendingOperationById.set(operation.id, operation);
                //         that we do in -_dispatchOperation
                //     */
                //     this._pendingOperationById.delete(operation.referrerId);
                // }

            }
        }
    },

    useDataAPI: {
        value: false
    },

    /*
      overriden to efficently counters the data structure
      returned by AWS RDS DataAPI efficently
    */
      addOneRawData: {
        value: function (stream, rawData, context) {
            //Data coming from Postresql
                if(!this.useDataAPI) {
                    /*
                        RawData from Postgres is
                        {
                            to_jsonb: {
                                ...Actual RawData
                            }
                        }

                        but others aren't
                    */
                    return this.super(stream, rawData.to_jsonb || rawData, context);
                } else {
                    if(Array.isArray(rawData)) {
                        return this.super(stream, JSON.parse(rawData[0].stringValue), context);
                    }
                    //Possible others
                    else {
                        return this.super(stream, rawData, context);
                    }

                }
        }
    },

    // handleReadUpdateOperation: {
    //     value: function (operation) {
    //         var referrer = operation.referrerId,
    //             objectDescriptor = operation.target,
    //             records = operation.data,
    //             stream = DataService.mainService.registeredDataStreamForDataOperation(operation),
    //             streamObjectDescriptor;
    //         // if(operation.type === DataOperation.Type.ReadCompletedOperation) {
    //         //     console.log("handleReadCompleted  referrerId: ",operation.referrerId, "records.length: ",records.length);
    //         // } else {
    //         //     console.log("handleReadUpdateOperation  referrerId: ",operation.referrerId, "records.length: ",records.length);
    //         // }
    //         //if(operation.type === DataOperation.Type.ReadUpdateOperation) console.log("handleReadUpdateOperation  referrerId: ",referrer);

    //         if(stream) {
    //             streamObjectDescriptor = stream.query.type;
    //             /*

    //                 We now could get readUpdate that are reads for readExpressions that are properties (with a valueDescriptor) of the ObjectDescriptor of the referrer. So we need to add a check that the obectDescriptor match, otherwise, it needs to be assigned to the right instance, or created in memory and mapping/converters will find it.
    //             */

    //             if(streamObjectDescriptor === objectDescriptor) {
    //                 if(records && records.length > 0) {
    //                     //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
    //                     this.addRawData(stream, records, operation);

    //                 } else if(operation.type !== DataOperation.Type.ReadCompletedOperation){
    //                     console.log("operation of type:"+operation.type+", has no data");
    //                 }
    //             } else {
    //                 console.log("Received "+operation.type+" operation that is for a readExpression of referrer ",referrer);
    //             }
    //         } else {
    //             console.log("receiving operation of type:"+operation.type+", but can't find a matching stream");
    //         }
    //     }
    // },

    // handleReadCompletedOperation: {
    //     value: function (operation) {
    //         this.handleReadUpdateOperation(operation);
    //         //The read is complete
    //         var stream = DataService.mainService.registeredDataStreamForDataOperation(operation);
    //         if(stream) {
    //             this.rawDataDone(stream);
    //             //this._thenableByOperationId.delete(operation.referrerId);
    //             DataService.mainService.unregisterDataStreamForDataOperation(operation);
    //         } else {
    //             console.log("receiving operation of type:"+operation.type+", but can't find a matching stream");
    //         }
    //         //console.log("handleReadCompleted -clear _thenableByOperationId- referrerId: ",operation.referrerId);

    //     }
    // },

    // handleReadFailedOperation: {
    //     value: function (operation) {
    //         var stream = DataService.mainService.registeredDataStreamForDataOperation(operation);
    //         this.rawDataError(stream,operation.data);

    //         DataService.mainService.unregisterDataStreamForDataOperation(operation);
    //         //this._thenableByOperationId.delete(operation.referrerId);
    //     }
    // },

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

    handleCreateCompletedOperation: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },


    handleUpdateCompletedOperation: {
        value: function (operation) {
            this.handleOperationCompleted(operation);
        }
    },

    _readOperationQueue: {
        value: undefined
    },

    handleReadOperation: {
        value: function (operation) {
            if(this.handlesType(operation.target)) {
                this._readOperationQueue.push(operation);
                if (this._readOperationQueue.length === 1) {
                    queueMicrotask(() => {
                    //this._processOperationQueueTimeout = setTimeout(() => {

                        if(this._processOperationQueueTimeout) {
                            clearTimeout(this._processOperationQueueTimeout);
                        }
                        var _operation;
                        if(this._readOperationQueue.length > 1) {
                            // _operation = new DataOperation();
                            // _operation.type = DataOperation.Type.BatchOperation;
                            // // batchOperation.target= transactionObjecDescriptors,
                            // _operation.data = {
                            //         batchedOperations: this._dispatchOperationQueue
                            // };
                            // this._pendingOperationById.set(_operation.id, _operation);
                            //console.log("this._socketSendOperation ",this._readOperationQueue);
                            this._socketSendOperation(this._readOperationQueue);

                        } else {
                            //console.log("this._socketSendOperation ",this._readOperationQueue[0]);

                            this._socketSendOperation(this._readOperationQueue[0]);

                        }

                        // var serializedOperation = this._serializer.serializeObject(_operation);
                        // this._socket.send(serializedOperation);
                        this._readOperationQueue = [];

                    //},0);
                    });
                }

                //this._socketSendOperation(operation);
            }
        }
    },

    handlePerformTransactionOperation: {
        value: function (performTransactionOperation) {
            this._socketSendOperation(performTransactionOperation);
        }
    },

    handleCreateTransactionOperation: {
        value: function (createTransactionOperation) {
            this._socketSendOperation(createTransactionOperation);
        }
    },

    handleCreateTransactionCompletedOperation: {
        value: function (operation) {
            var rawTransaction

            this.super(operation);
        }
    },

    handleAppendTransactionOperation: {
        value: function (appendTransactionOperation) {
            this._socketSendOperation(appendTransactionOperation);
        }
    },

    handleCommitTransactionOperation: {
        value: function (commitTransactionOperation) {
            this._socketSendOperation(commitTransactionOperation);
        }
    },

    handleRollbackTransactionOperation: {
        value: function (rollbackTransactionOperation) {
            this._socketSendOperation(rollbackTransactionOperation);
        }
    },

    _textEncoder: {
        get: function() {
            return this.__textEncoder || (this.__textEncoder= new TextEncoder());
        }
    },

    _bytesConverter: {
        get: function() {
            return this.__bytesConverter || (this.__bytesConverter= new BytesConverter());
        }
    },

    _socketSendOperation: {
        value: function(operation) {
            this._socketOpenPromise.then(() => {
                var serializedOperation = this._serializer.serializeObject(operation);

                 var operationDataKBSize = sizeof(serializedOperation) / 1024;

                 console.debug("----> send "+operationDataKBSize+" KB operation "+serializedOperation);

                // if(operation.type === "batch") {
                //     var deserializer = new Deserializer();
                //     deserializer.init(serializedOperation, require, undefined, module, true);
                //     var deserializedOperation = deserializer.deserializeObject();
                //     console.log(deserializedOperation);
                // }

                // if(isMod) {
                //     console.log("send message size: "+ this._bytesConverter.convert(this._textEncoder.encode(serializedOperation).length));
                // }

                this._socket.send(serializedOperation);
            });
        }
    },

    handleEvent: {
        value: function(operation) {
            // if(!this.handlesType(operation.target)) {
            //     return;
            // }

            console.warn(("no concrete handling for event type "+operation.type));

            // if(operation instanceof DataOperation) {
            //     this._socketOpenPromise.then(() => {
            //         var serializedOperation = this._serializer.serializeObject(operation);

            //         //console.log("----> send operation "+serializedOperation);

            //         // if(operation.type === "batch") {
            //         //     var deserializer = new Deserializer();
            //         //     deserializer.init(serializedOperation, require, undefined, module, true);
            //         //     var deserializedOperation = deserializer.deserializeObject();
            //         //     console.log(deserializedOperation);
            //         // }

            //         this._socket.send(serializedOperation);
            //     });
            // }
        }
    }

});
