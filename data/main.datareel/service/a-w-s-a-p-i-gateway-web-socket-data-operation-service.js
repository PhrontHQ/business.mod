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


                mainService.addEventListener(DataOperation.Type.Read,this,false);
                mainService.addEventListener(DataOperation.Type.Update,this,false);
                mainService.addEventListener(DataOperation.Type.Create,this,false);
                mainService.addEventListener(DataOperation.Type.Delete,this,false);
                mainService.addEventListener(DataOperation.Type.CreateTransaction,this,false);
                mainService.addEventListener(DataOperation.Type.Batch,this,false);
                mainService.addEventListener(DataOperation.Type.PerformTransaction,this,false);
                mainService.addEventListener(DataOperation.Type.RollbackTransaction,this,false);
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
            this._socket = new WebSocket(this.connection.websocketURL);

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

                        return console.error("Invalid Operation Serialization:", event.data);
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


    handleEvent: {
        value: function(operation) {
            if(operation instanceof DataOperation) {
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
        }
    }

});
