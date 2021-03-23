var DataService = require("montage/data/service/data-service").DataService,
    RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    Promise = require("montage/core/promise").Promise,
    evaluate = require("montage/core/frb/evaluate"),
    Set = require("montage/core/collections/set"),
    Map = require("montage/core/collections/map"),
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    Phluid = require("./phluid").Phluid,
    WebSocket = require("montage/core/web-socket").WebSocket,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
    currentEnvironment = require("montage/core/environment").currentEnvironment;

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

            this._serializer = new MontageSerializer().initWithRequire(require);
            this._deserializer = new Deserializer();

            return this;
        }
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

                mainService.addEventListener(DataOperation.Type.ReadOperation,this,false);
                mainService.addEventListener(DataOperation.Type.UpdateOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateOperation,this,false);
                mainService.addEventListener(DataOperation.Type.DeleteOperation,this,false);
                mainService.addEventListener(DataOperation.Type.CreateTransactionOperation,this,false);
                mainService.addEventListener(DataOperation.Type.BatchOperation,this,false);
                mainService.addEventListener(DataOperation.Type.PerformTransactionOperation,this,false);
                mainService.addEventListener(DataOperation.Type.RollbackTransactionOperation,this,false);


                /*
                    DataOperation coming back with a referrer, we listen on ouselves
                */
                mainService.addEventListener(DataOperation.Type.NoOp,this,false);
                mainService.addEventListener(DataOperation.Type.ReadFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.ReadCompletedOperation,this,false);
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
                mainService.addEventListener(DataOperation.Type.TransactionUpdatedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.PerformTransactionFailedOperation,this,false);
                mainService.addEventListener(DataOperation.Type.PerformTransactionCompletedOperation,this,false);
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
            var applicationIdentity = this.application.identity,
                serializedIdentity,
                base64EncodedSerializedIdentity;

            if(applicationIdentity) {
                try {

                    serializedIdentity = this._serializer.serializeObject(applicationIdentity);
                    base64EncodedSerializedIdentity = btoa(serializedIdentity);

                } catch(error) {
                    console.error(error);
                    throw error;
                }


            }

            this._socket = new WebSocket(this.connection.websocketURL+"?identity="+base64EncodedSerializedIdentity);

            this._socket.addEventListener("open", this);
            this._socket.addEventListener("error", this);
            this._socket.addEventListener("close", this);
            this._socket.addEventListener("message", this);

        }
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


    _operationListenerNamesByType: {
        value: new Map()
    },
    _operationListenerNameForType: {
        value: function(type) {
            return this._operationListenerNamesByType.get(type) || this._operationListenerNamesByType.set(type,"handle"+type.toCapitalized()).get(type);
        }
    },

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

                        return console.error("Invalid Operation Serialization:", e, event.data);
                    }
                }

                if(operation) {
                    defaultEventManager.handleEvent(operation);
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

    handleReadUpdateOperation: {
        value: function (operation) {
            var referrer = operation.referrerId,
                objectDescriptor = operation.target,
                records = operation.data,
                stream = DataService.mainService.registeredDataStreamForDataOperation(operation),
                streamObjectDescriptor;
            // if(operation.type === DataOperation.Type.ReadCompletedOperation) {
            //     console.log("handleReadCompleted  referrerId: ",operation.referrerId, "records.length: ",records.length);
            // } else {
            //     console.log("handleReadUpdateOperation  referrerId: ",operation.referrerId, "records.length: ",records.length);
            // }
            //if(operation.type === DataOperation.Type.ReadUpdateOperation) console.log("handleReadUpdateOperation  referrerId: ",referrer);

            if(stream) {
                streamObjectDescriptor = stream.query.type;
                /*

                    We now could get readUpdate that are reads for readExpressions that are properties (with a valueDescriptor) of the ObjectDescriptor of the referrer. So we need to add a check that the obectDescriptor match, otherwise, it needs to be assigned to the right instance, or created in memory and mapping/converters will find it.
                */

                if(streamObjectDescriptor === objectDescriptor) {
                    if(records && records.length > 0) {
                        //We pass the map key->index as context so we can leverage it to do record[index] to find key's values as returned by RDS Data API
                        this.addRawData(stream, records, operation);

                    } else if(operation.type !== DataOperation.Type.ReadCompletedOperation){
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

    handleReadCompletedOperation: {
        value: function (operation) {
            this.handleReadUpdateOperation(operation);
            //The read is complete
            var stream = DataService.mainService.registeredDataStreamForDataOperation(operation);
            if(stream) {
                this.rawDataDone(stream);
                //this._thenableByOperationId.delete(operation.referrerId);
                DataService.mainService.unregisterDataStreamForDataOperation(operation);
            } else {
                console.log("receiving operation of type:"+operation.type+", but can't find a matching stream");
            }
            //console.log("handleReadCompleted -clear _thenableByOperationId- referrerId: ",operation.referrerId);

        }
    },

    handleReadFailedOperation: {
        value: function (operation) {
            var stream = this._thenableByOperationId.get(operation.referrerId);
            this.rawDataError(stream,operation.data);
            DataService.mainService.unregisterDataStreamForDataOperation(operation);
            //this._thenableByOperationId.delete(operation.referrerId);
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

    handleReadOperation: {
        value: function (operation) {
            if(this.handlesType(operation.target)) {
                this._socketSendOperation(operation);
            }
        }
    },

    _socketSendOperation: {
        value: function(operation) {
            this._socketOpenPromise.then(() => {
                var serializedOperation = this._serializer.serializeObject(operation);

                //console.log("----> send operation "+serializedOperation);

                // if(operation.type === "batch") {
                //     var deserializer = new Deserializer();
                //     deserializer.init(serializedOperation, require, undefined, module, true);
                //     var deserializedOperation = deserializer.deserializeObject();
                //     console.log(deserializedOperation);
                // }

                this._socket.send(serializedOperation);
            });
        }
    },

    handleEvent: {
        value: function(operation) {
            if(!this.handlesType(operation.target)) {
                return;
            }

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
