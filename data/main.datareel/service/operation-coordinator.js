// if(global && typeof global.XMLHttpRequest === undefined) {
//     global.XMLHttpRequest = require('xhr2');
// }
var Target = require("montage/core/target").Target,

MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
// mainService = require("data/main.datareel/main.mjson").montageObject,
//phrontService = mainService.childServices[0],
DataOperation = require("montage/data/service/data-operation").DataOperation,
defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
currentEnvironment = require("montage/core/environment").currentEnvironment,
sizeof = require('object-sizeof');

exports.OperationCoordinator = Target.specialize(/** @lends OperationCoordinator.prototype */ {

    /***************************************************************************
     * Constructor
     */

    constructor: {
        value: function OperationCoordinator(worker) {
            this._serializer = new MontageSerializer().initWithRequire(require);
            this._deserializer = new Deserializer();

            this._gatewayClientByClientId = new Map();
            this._pendingOperationById = new Map();

            var mainService = worker.mainService;
            //Do we need to keep a handle on it?
            this.worker = worker;
            this.mainService = mainService;
            this.application = defaultEventManager.application;

            var phrontService = this.mainService.childServices[0];


            phrontService.operationCoordinator = this;

            // mainService.addEventListener(DataOperation.Type.Read,phrontService,false);
            // mainService.addEventListener(DataOperation.Type.Update,phrontService,false);
            // mainService.addEventListener(DataOperation.Type.Create,phrontService,false);
            // mainService.addEventListener(DataOperation.Type.Delete,phrontService,false);
            // mainService.addEventListener(DataOperation.Type.CreateTransaction,phrontService,false);
            // mainService.addEventListener(DataOperation.Type.Batch,phrontService,false);
            // mainService.addEventListener(DataOperation.Type.PerformTransaction,phrontService,false);
            // mainService.addEventListener(DataOperation.Type.RollbackTransaction,phrontService,false);

            this.addEventListener(DataOperation.Type.CreateTransaction,this,false);
            this.addEventListener(DataOperation.Type.Batch,this,false);
            this.addEventListener(DataOperation.Type.PerformTransaction,this,false);
            this.addEventListener(DataOperation.Type.RollbackTransaction,this,false);

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

            return this;
        }
    },

    MAX_PAYLOAD_SIZE: {
        value: 63
    },

    registerGatewayClientForClientId: {
        value: function(gatewayClient, clientId) {
            this._gatewayClientByClientId.set(clientId,gatewayClient);
        }
    },
    gatewayClientForClientId: {
        value: function(clientId) {
            return this._gatewayClientByClientId.get(clientId);
        }
    },
    unregisterGatewayClientForClientId: {
        value: function(gatewayClient, clientId) {
            this._gatewayClientByClientId.set(clientId,gatewayClient);
        }
    },

    _sendData: {
        value: function (previousPromise, connection, clientId, data) {
            //console.log("OperationCoordinator: _sendData to connection:", connection, clientId, data);

            return (previousPromise || Promise.resolve(true))
                    .then(function() {
                        try {

                            return postToConnectionPromise = connection.postToConnection({
                                ConnectionId: clientId,
                                Data: data
                            }).promise();
                        } catch (e) {
                            console.log("OperationCoordinator: _sendData postToConnection error:", e, connection, clientId, data);

                            if (e.statusCode === 410) {
                                console.log(`Found stale connection, should delete connectionId ${clientId}`);
                                // await ddb.delete({ TableName: TABLE_NAME, Key: { connectionId } }).promise();
                            } else {
                                console.error(e);
                                throw e;
                            }
                        }

                    });
        }
    },

    dispatchOperationToConnectionClientId: {
        value: function(operation, connection, clientId) {

            //console.log("OperationCoordinator: dispatchOperationToConnectionClientId()",operation, connection, clientId)

            //remove _target & _currentTarget as it creates a pbm? and we don't need to send it
            delete operation._currentTarget;

            //We need to assess the size of the data returned.
            //serialize
            var operationSerialization = this._serializer.serializeObject(operation);
            var operationDataKBSize = sizeof(operationSerialization) / 1024;
            if(operationDataKBSize < this.MAX_PAYLOAD_SIZE) {
                //console.log("operation size is "+operationDataKBSize);
                //console.log("OperationCoordinator: dispatchOperationToConnectionClientId() connection.postToConnection #1 operation.referrerId "+operation.referrerId);

                return this._sendData(undefined, connection, clientId, operationSerialization);

                // return connection
                // .postToConnection({
                //     ConnectionId: clientId,
                //     Data: this._serializer.serializeObject(operation)
                // })
                // .promise();
            }
            else {
                /*
                    Failing:
                    Large ReadOperation split in 1 sub operations: operationDataKBSize:230.927734375, integerSizeQuotient:1, sizeRemainder:102.927734375, operationData.length:0, integerLengthQuotient:170, lengthRemainder: 0


                */

               //console.log("dispatchOperationToConnectionClientId: referrerId "+operation.referrerId);

                var integerSizeQuotient = Math.floor(operationDataKBSize / this.MAX_PAYLOAD_SIZE),
                    sizeRemainder = operationDataKBSize % this.MAX_PAYLOAD_SIZE,
                    sizeRemainderRatio = sizeRemainder/operationDataKBSize,
                    operationData = operation.data,
                    integerLengthQuotient = Math.floor(operationData.length / integerSizeQuotient),
                    lengthRemainder = operationData.length % integerSizeQuotient,
                    i=0, countI = integerSizeQuotient, iData, iReadUpdateOperation,
                    iPromise = Promise.resolve(true);
                    promises = [],
                    self = this;

                    if(lengthRemainder === 0 && sizeRemainder > 0) {
                        lengthRemainder = Math.floor(operationData.length*sizeRemainderRatio);
                        integerLengthQuotient = integerLengthQuotient-Math.floor(lengthRemainder/integerSizeQuotient);
                        //integerLengthQuotient = operationData.length-lengthRemainder;
                    }

                    iReadUpdateOperation = new DataOperation();
                    iReadUpdateOperation.type = DataOperation.Type.ReadUpdate;
                    iReadUpdateOperation.target = operation.target;
                    iReadUpdateOperation.criteria = operation.criteria;
                    iReadUpdateOperation.referrerId = operation.referrerId;

                    for(;(i<countI);i++) {
                        iReadUpdateOperation.data = operationData.splice(0,integerLengthQuotient);
                        if((operation.type === DataOperation.Type.ReadCompleted) && i === (countI-1) && (operationData.length === 0)) {
                            iReadUpdateOperation.type = DataOperation.Type.ReadCompleted;
                        }

                        //console.log("OperationCoordinator: dispatchOperationToConnectionClientId() connection.postToConnection #2 operation.referrerId "+operation.referrerId);
                        iPromise = this._sendData(iPromise, connection, clientId, self._serializer.serializeObject(iReadUpdateOperation));

                        // iPromise = iPromise.then(function() {
                        //     console.log("OperationCoordinator: dispatchOperationToConnectionClientId() connection.postToConnection #2",operation, connection, clientId);
                        //     return connection.postToConnection({
                        //         ConnectionId: clientId,
                        //         Data: self._serializer.serializeObject(iReadUpdateOperation)
                        //     }).promise();
                        //})
                    }

                    //Sends the last if some left:
                    if(lengthRemainder || operationData.length) {
                        //console.log("OperationCoordinator: dispatchOperationToConnectionClientId() connection.postToConnection #3 operation.referrerId "+operation.referrerId);
                        iPromise = this._sendData(iPromise, connection, clientId, self._serializer.serializeObject(operation));

                        // iPromise = iPromise.then(function() {
                        //     console.log("OperationCoordinator: dispatchOperationToConnectionClientId() connection.postToConnection #3",operation, connection, clientId);
                        //     return connection.postToConnection({
                        //         ConnectionId: clientId,
                        //         Data: self._serializer.serializeObject(operation)
                        //     }).promise()
                        // });
                    }
                    //console.log(">>>>Large ReadOperation split in "+(countI+lengthRemainder)+ " sub operations: operationDataKBSize:"+operationDataKBSize+", integerSizeQuotient:"+integerSizeQuotient+", sizeRemainder:"+sizeRemainder+", operationData.length:"+operationData.length+", integerLengthQuotient:"+integerLengthQuotient+", lengthRemainder:",lengthRemainder );
                    return iPromise;
            }
        }
    },

    /*
        Event Handler for DataOperations destined to clients.

        We might want to add a layer of caching where an operation sent by one client, might end up being the same as subsequent ones sent by others, in which case the one in flight could be used to dispatch to the other clients, making sure we'd match their referrerId, etc... before we serialize and send them back.

        Look at https://github.com/puleos/object-hash
        when it comes to pooling operations bound to the database.
    */

    handleEvent: {
        value: function(operation) {

            /*
                We're now receiving PhrontService event/operations that are response to operations initiated locally, so until we sort out more carefully who answer what, we're going to make sure we filter operations that don't have a clientId, and to be even more careful, if there's a clientId, to compare it to the one in environemnt, which is re-set everytime we receive a call from the APIGateway
            */
            if(operation.clientId) {
                var self = this;
                //console.log("handleEvent:",operation);
                this.dispatchOperationToConnectionClientId(operation,this.gateway,operation.clientId)
                .then(function(values) {
                    //resolve
                    self._operationPromisesByReferrerId.get(operation.referrerId)[0]();
                },function(error) {
                    //reject
                    self._operationPromisesByReferrerId.get(operation.referrerId)[1](error);
                });
            }
        }
    },

    //Todo: send the client a "connected" operation that could contain it's IP address and languages
    // handleConnect: {
    //     value: function (connectOperation) {

    //     }
    // },

    /*

        var serializedHandledOperation = await operationCoordinator.handleMessage(event, context, cb, client);

    */
    gateway: {
        value: undefined
    },
    _operationPromisesByReferrerId: {
        value: new Map()
    },

    handleMessage: {
        value: function(event, context, callback, gatewayClient) {

            this.gateway = gatewayClient;

            var serializedOperation = event.body,
                deserializedOperation,
                objectRequires,
                module,
                isSync = true,
                resultOperationPromise,
                self = this,
                phrontService = this.mainService.childServices[0];

            //console.log(serializedOperation);

            this._deserializer.init(serializedOperation, require, objectRequires, module, isSync);
            try {
                deserializedOperation = this._deserializer.deserializeObject();
            } catch (ex) {
                console.error("No deserialization for ",serializedOperation);
            }

            if(deserializedOperation && !deserializedOperation.target && deserializedOperation.dataDescriptor) {
                deserializedOperation.target = this.mainService.objectDescriptorWithModuleId(deserializedOperation.dataDescriptor);
            }

            //Add connection (custom) info the operation:
            // deserializedOperation.connection = gatewayClient;

            /*
                Sets the whole AWS API Gateway event as the dataOperations's context.

                Reading the stage for example -
                aDataOperation.context.requestContext.stage

                Can help a DataService address the right resource/database for that stage
            */
            deserializedOperation.context = event;

            //Set the clientId (in API already)
            deserializedOperation.clientId = event.requestContext.connectionId;

            // console.log("OperationCoordinator handleMessage(...)",deserializedOperation);

            return this.handleOperation(deserializedOperation, event, context, callback, gatewayClient);
        }
    },

    handleOperation: {
        value: function(deserializedOperation, event, context, callback, gatewayClient) {
            var self = this;

            /*
                Workaround until we get the serialization/deserialization to work with an object passed with a label that is pre-existing and passed to both the serialiaer and deserializer on each side.

                So until then, if target is null, it's meant for the coordinaator, needed for transactions that could contain object descriptors that are handled by different data services and the OperationCoordinator will have to handle that himself first to triage, before distributing to the relevant data services by creating nested transactions with the subset of dataoperations/types they deal with.
            */
            if(!deserializedOperation.target) {
                deserializedOperation.target = this;
            }

            if(
                (deserializedOperation.type ===  DataOperation.Type.Read) ||
                (deserializedOperation.type ===  DataOperation.Type.Connect) ||
                (deserializedOperation.type ===  DataOperation.Type.Create) ||
                (deserializedOperation.type ===  DataOperation.Type.Update) ||
                (deserializedOperation.type ===  DataOperation.Type.Delete) ||
                (deserializedOperation.type ===  DataOperation.Type.CreateTransaction) ||
                (deserializedOperation.type ===  DataOperation.Type.Batch) ||
                (deserializedOperation.type ===  DataOperation.Type.PerformTransaction) ||
                (deserializedOperation.type ===  DataOperation.Type.RollbackTransaction) ||
                (deserializedOperation.type ===  DataOperation.Type.Merge)
            ) {
                resultOperationPromise = new Promise(function(resolve,reject) {
                    self._operationPromisesByReferrerId.set(deserializedOperation.id,[resolve,reject]);
                    defaultEventManager.handleEvent(deserializedOperation);

                    //If Connect, we can't really return anything to the client, so we resolve now:
                    if(deserializedOperation.type ===  DataOperation.Type.Connect) {
                        resolve(true);
                    }
                });

                return resultOperationPromise;
                //resultOperationPromise = phrontService.handleRead(deserializedOperation);
                //phrontService.handleRead(deserializedOperation);
            } else {
                console.error("OperationCoordinator: not programmed to handle type of operation ",deserializedOperation);
                resultOperationPromise = Promise.reject(null);
            }

            if(!resultOperationPromise) {

                return Promise.resolve(true);

            } else {
                return resultOperationPromise.then(function(operationCompleted) {
                    //serialize
                    // return self._serializer.serializeObject(operationCompleted);
                    return self.dispatchOperationToConnectionClientId(operationCompleted,gatewayClient,event.requestContext.connectionId);

                },function(operationFailed) {
                    console.error("OperationCoordinator: resultOperationPromise failed ",operationFailed);
                    return self.dispatchOperationToConnectionClientId(operationFailed,gatewayClient,event.requestContext.connectionId);
                    // return self._serializer.serializeObject(operationFailed);
                });
            }
        }
    },

    handleCreateTransaction: {
        value: function (createTransactionOperation) {
            //Need to analyze the array of object descriptors:
            var objectDescriptorModuleIds = createTransactionOperation.data,
                i, countI, iObjectDescriptorModuleId, iObjectDescriptor, iObjectDescriptorDataService, iOperation, iObjectDescriptors
                objectDescriptorByDataService = new Map();

            createTransactionOperation.objectDescriptorByDataService = objectDescriptorByDataService;
            if(objectDescriptorModuleIds) {
                for(i=0, countI = objectDescriptorModuleIds.length; (i<countI); i++) {
                    iObjectDescriptorModuleId = objectDescriptorModuleIds[i];

                    iObjectDescriptor = this.mainService.objectDescriptorWithModuleId(iObjectDescriptorModuleId);
                    if(!iObjectDescriptor) {
                        console.warn("Could not find an ObjecDescriptor with moduleId "+iObjectDescriptorModuleId);
                    } else {
                        iObjectDescriptorDataService = this.mainService.childServiceForType(iObjectDescriptor);
                        if(!iObjectDescriptorDataService) {
                            console.warn("Could not find a DataService for ObjecDescriptor: ",iObjectDescriptor);
                        } else {

                            iObjectDescriptors = objectDescriptorByDataService.get(iObjectDescriptorDataService);
                            if(!iObjectDescriptors) {
                                objectDescriptorByDataService.set(iObjectDescriptorDataService,(iObjectDescriptors = [iObjectDescriptor]));
                            } else {
                                iObjectDescriptors.push(iObjectDescriptor);
                            }
                        }
                    }
                }


                this._pendingOperationById.set(createTransactionOperation.id,createTransactionOperation);

                /*
                    special case, the createTransaction's objectDescriptors are all for the same RawDataService, we re-target
                */
                if(objectDescriptorByDataService.size === 1) {
                    createTransactionOperation.target = iObjectDescriptorDataService;

                    /*
                        We know who needs it and that the listener implements that method.

                        createTransactionOperation.target.handleCreateTransaction(createTransactionOperation);

                        is a shortcut to

                        defaultEventManager.handleEvent(createTransactionOperation);

                        which itself is a shortcut to

                        createTransactionOperation.target.dispatchEvent(createTransactionOperation);
                    */

                   createTransactionOperation.target.handleCreateTransaction(createTransactionOperation);

                    /*
                        The client will get the createtransactioncompleted from the single DataService.
                        We don't need to stay in the middle.
                    */

                } else if(objectDescriptorByDataService.size > 1) {


                    let nestedCreateTransactionsById,
                        mapIterator = objectDescriptorByDataService.entries(),
                        iterationOperation,
                        mapIteration;

                        createTransactionOperation.nestedCreateTransactionsById = nestedCreateTransactionsById = new Map();
                        createTransactionOperation.nestedCreateTransactionsFailedOperations = new Set();
                        createTransactionOperation.nestedCreateTransactionsCompletedOperations = new Set();

                    while ((mapIteration = mapIterator.next().value)) {
                        iterationOperation = new DataOperation();
                        iterationOperation.type = DataOperation.Type.CreateTransaction;
                        iterationOperation.referrerId = createTransactionOperation.id;

                        iterationOperation.target = mapIteration[0];
                        iterationOperation.data = mapIteration[1];

                        nestedCreateTransactionsById.set(iterationOperation.id,iterationOperation);

                        this._pendingOperationById.set(iterationOperation.id,iterationOperation);

                        /*
                            iterationOperation.target.handleCreateTransaction(iterationOperation);

                            is a shortcut to

                            defaultEventManager.handleEvent(iterationOperation);

                            which itself is a shortcut to

                            iterationOperation.target.dispatchEvent(iterationOperation);
                        */
                        iterationOperation.target.handleCreateTransaction(iterationOperation);

                        /*
                            We'll also need to know when all of these independent, per-service createTransactions are created.
                            The operation coordinator listens to operations on mainService where all rawDataServices' operations propagate. So for each createtransactioncompleted operations handled, we need to tally that we received them all, before dispatching ourselves a CreateTransactionCompleted to the client's createTransaction that we initially handled.
                        */

                    }

                }
            }
        }
    },

    _processCreateTransactionResultOperation: {
        value: function(createTransactionResultOperation) {
                //The id of a RawDataService dedicated nested createTransaction
                var referrerId = createTransactionResultOperation.referrerId,
                //The RawDataService dedicated nested createTransaction
                referrer = this._pendingOperationById.get(referrerId),
                rootCreateTransaction = referrer ? this._pendingOperationById.get(referrer.referrerId) : null;

            return rootCreateTransaction;
        }
    },

    handleCreateTransactionFailed: {
        value: function (createTransactionFailedOperation) {
            var rootCreateTransaction = this._processCreateTransactionResultOperation(createTransactionFailedOperation);

            rootCreateTransaction.nestedCreateTransactionsFailedOperations.add(createTransactionFailedOperation);

            if(rootCreateTransaction.nestedCreateTransactionsById.size ===
                (
                    createTransactionOperation.nestedCreateTransactionsFailedOperations.size +
                    createTransactionOperation.nestedCreateTransactionsCompletedOperations.size
                )) {
                    //Everything is back but some failed.... So we need to send  createTransactionFailed Operation to the client

                    var operation = new DataOperation();
                    operation.referrerId = rootCreateTransaction.id;
                    //We keep the same
                    /*
                        WARNING - it's ok as we handle it ourselves, but that  a null target would throw an exception if handled by the
                    */
                    operation.target = null;
                    operation.type = DataOperation.Type.CreateTransactionFailed;
                    operation.data = createTransactionOperation.nestedCreateTransactionsFailedOperations;

                //To dispatch to client:
                this.handleEvent(operation);

            }
        }
    },

    /*

        wether we had a transaction that was handled by one rawDataService only that we re-targetd to him or we have nested transactions, since we listen for "createTransactions" on mainService, we'll get the bubbling regardless.
    */
    handleCreateTransactionCompleted: {
        value: function (createTransactionCompletedOperation) {
            var operation,
                rootCreateTransaction = this._processCreateTransactionResultOperation(createTransactionCompletedOperation);

            if(rootCreateTransaction) {
                rootCreateTransaction.nestedCreateTransactionsCompletedOperations.add(createTransactionCompletedOperation);

                if(rootCreateTransaction.nestedCreateTransactionsById.size ===
                    (
                        createTransactionOperation.nestedCreateTransactionsFailedOperations.size +
                        createTransactionOperation.nestedCreateTransactionsCompletedOperations.size
                    )) {
                    var operation = new DataOperation();
                    operation.referrerId = rootCreateTransaction.id;
                    //We keep the same
                    /*
                        WARNING - it's ok as we handle it ourselves, but that  a null target would throw an exception if handled by the
                    */
                    operation.target = null;

                    if(createTransactionOperation.nestedCreateTransactionsFailedOperations.size === 0) {
                        //Everything is back and no fail.... So we need to send  createTransactionCompleted Operation to the client

                        operation.type = DataOperation.Type.CreateTransactionCompleted;
                        operation.data = rootCreateTransaction.data;
                    } else {
                        operation.type = DataOperation.Type.CreateTransactionFailed;
                        operation.data = createTransactionOperation.nestedCreateTransactionsFailedOperations;
                    }
                }

            } else {
                operation = createTransactionCompletedOperation;
            }

            //To dispatch to client:
            this.handleEvent(operation);

        }
    },
    handleBatch: {
        value: function (batchOperation) {
            var rootCreateTransaction =this._pendingOperationById.get(batchOperation.referrerId);

            if(rootCreateTransaction) {
                if(rootCreateTransaction.nestedCreateTransactionsById) {

                    console.error("Implement OperationCoordinator handleBatch when multiple DataServices are involved");

                } else {
                    //get the sole DataService involved
                    var dataService = rootCreateTransaction.objectDescriptorByDataService.keys().next().value;

                    batchOperation.target = dataService;

                    /*
                        We know who needs it and that the listener implements that method.

                        createTransactionOperation.target.handleCreateTransaction(createTransactionOperation);

                        is a shortcut to

                        defaultEventManager.handleEvent(createTransactionOperation);

                        which itself is a shortcut to

                        createTransactionOperation.target.dispatchEvent(createTransactionOperation);
                    */

                   batchOperation.target.handleBatch(batchOperation);

                }
            }
        }
    },

    handlePerformTransaction: {
        value: function (performTransactionOperation) {
            var rootCreateTransaction =this._pendingOperationById.get(performTransactionOperation.referrerId);

            if(rootCreateTransaction) {
                if(rootCreateTransaction.nestedCreateTransactionsById) {

                    console.error("Implement OperationCoordinator handlePerformTransaction when multiple DataServices are involved");

                } else {
                    //get the sole DataService involved
                    var dataService = rootCreateTransaction.objectDescriptorByDataService.keys().next().value;

                    performTransactionOperation.target = dataService;

                    /*
                        We know who needs it and that the listener implements that method.

                        createTransactionOperation.target.handleCreateTransaction(createTransactionOperation);

                        is a shortcut to

                        defaultEventManager.handleEvent(createTransactionOperation);

                        which itself is a shortcut to

                        createTransactionOperation.target.dispatchEvent(createTransactionOperation);
                    */

                   performTransactionOperation.target.handlePerformTransaction(performTransactionOperation);

                }
            }
        }
    }
});
