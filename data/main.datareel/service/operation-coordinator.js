// if(global && typeof global.XMLHttpRequest === undefined) {
//     global.XMLHttpRequest = require('xhr2');
// }
var Montage = require("montage/core/core").Montage,
MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
DataOperation = require("montage/data/service/data-operation").DataOperation,
mainService = require("data/main.datareel/main.mjson").montageObject,
phrontService = mainService.childServices[0],
DataOperation = require("montage/data/service/data-operation").DataOperation,
defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
sizeof = require('object-sizeof');


exports.OperationCoordinator = Montage.specialize(/** @lends OperationCoordinator.prototype */ {

    /***************************************************************************
     * Constructor
     */

    constructor: {
        value: function OperationCoordinator() {
            this._serializer = new MontageSerializer().initWithRequire(require);
            this._deserializer = new Deserializer();

            this._gatewayClientByClientId = new Map();

            phrontService.operationCoordinator = this;
            mainService.addEventListener(DataOperation.Type.Read,phrontService,false);
            mainService.addEventListener(DataOperation.Type.Update,phrontService,false);
            mainService.addEventListener(DataOperation.Type.Create,phrontService,false);
            mainService.addEventListener(DataOperation.Type.Delete,phrontService,false);
            mainService.addEventListener(DataOperation.Type.CreateTransaction,phrontService,false);
            mainService.addEventListener(DataOperation.Type.PerformTransaction,phrontService,false);
            mainService.addEventListener(DataOperation.Type.RollbackTransaction,phrontService,false);

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

    dispatchOperationToConnectionClientId: {
        value: function(operation, connection, clientId) {

            //remove _target & _currentTarget as it creates a pbm? and we don't need to send it
            delete operation._currentTarget;
            delete operation._target;

            //We need to assess the size of the data returned.
            //serialize
            var operationDataKBSize = sizeof(operation) / 1024;
            if(operationDataKBSize < this.MAX_PAYLOAD_SIZE) {
                //console.log("operation size is "+operationDataKBSize);
                return connection
                .postToConnection({
                    ConnectionId: clientId,
                    Data: this._serializer.serializeObject(operation)
                })
                .promise();
            }
            else {
                /*
                    Failing:
                    Large ReadOperation split in 1 sub operations: operationDataKBSize:230.927734375, integerSizeQuotient:1, sizeRemainder:102.927734375, operationData.length:0, integerLengthQuotient:170, lengthRemainder: 0


                */
                var integerSizeQuotient = Math.floor(operationDataKBSize / this.MAX_PAYLOAD_SIZE),
                    sizeRemainder = operationDataKBSize % this.MAX_PAYLOAD_SIZE,
                    sizeRemainderRatio = sizeRemainder/operationDataKBSize,
                    operationData = operation.data,
                    integerLengthQuotient = Math.floor(operationData.length / integerSizeQuotient),
                    lengthRemainder = operationData.length % integerSizeQuotient,
                    i=0, countI = integerSizeQuotient, iChunk, iReadUpdateOperation,
                    promises = [];

                    if(lengthRemainder === 0 && sizeRemainder > 0) {
                        lengthRemainder = Math.floor(operationData.length*sizeRemainderRatio);
                        integerLengthQuotient = operationData.length-lengthRemainder;
                    }

                    iReadUpdateOperation = new DataOperation();
                    iReadUpdateOperation.type = DataOperation.Type.ReadUpdate;
                    iReadUpdateOperation.dataDescriptor = operation.dataDescriptor;
                    iReadUpdateOperation.criteria = operation.dataDescriptor;
                    iReadUpdateOperation.referrerId = operation.referrerId;

                    for(;(i<countI);i++) {
                        if((operation.type === DataOperation.Type.ReadCompleted) && i === (countI-1) && (lengthRemainder === 0)) {
                            iReadUpdateOperation.type = DataOperation.Type.ReadCompleted;
                        }
                        iReadUpdateOperation.data = operationData.splice(0,integerLengthQuotient);
                        promises.push(connection.postToConnection({
                            ConnectionId: clientId,
                            Data: this._serializer.serializeObject(iReadUpdateOperation)
                        }).promise());
                    }

                    //Sends the last if some left:
                    if(lengthRemainder || operationData.length) {
                        promises.push(connection.postToConnection({
                            ConnectionId: clientId,
                            Data: this._serializer.serializeObject(operation)
                        }).promise());
                    }
                    console.log("Large ReadOperation split in "+(countI+lengthRemainder)+ " sub operations: operationDataKBSize:"+operationDataKBSize+", integerSizeQuotient:"+integerSizeQuotient+", sizeRemainder:"+sizeRemainder+", operationData.length:"+operationData.length+", integerLengthQuotient:"+integerLengthQuotient+", lengthRemainder:",lengthRemainder );
                    return Promise.all(promises);
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
            this.dispatchOperationToConnectionClientId(operation,this.gateway,operation.clientId);
        }
    },
    /*

        var serializedHandledOperation = await operationCoordinator.handleMessage(event, context, cb, client);

    */
    gateway: {
        value: undefined
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
                self = this;

            this._deserializer.init(serializedOperation, require, objectRequires, module, isSync);
            deserializedOperation = this._deserializer.deserializeObject();

            if(!deserializedOperation.target && deserializedOperation.dataDescriptor) {
                deserializedOperation.target = mainService.objectDescriptorWithModuleId(deserializedOperation.dataDescriptor);
            }

            //Add connection (custom) info the operation:
            // deserializedOperation.connection = gatewayClient;

            //Set the clientId (in API already)
            deserializedOperation.clientId = event.requestContext.connectionId;

            defaultEventManager.handleEvent(deserializedOperation);
            //console.log("handleEvent(...)",deserializedOperation);

            if(deserializedOperation.type ===  DataOperation.Type.Read) {

                //resultOperationPromise = phrontService.handleRead(deserializedOperation);
                //phrontService.handleRead(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.Update) {

                resultOperationPromise = phrontService.handleUpdate(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.Create) {

                resultOperationPromise = phrontService.handleCreate(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.Delete) {

                resultOperationPromise = phrontService.handleDelete(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.CreateTransaction) {

                resultOperationPromise = phrontService.handleCreateTransaction(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.Batch) {

                resultOperationPromise = phrontService.handleBatch(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.PerformTransaction) {

                resultOperationPromise = phrontService.handlePerformTransaction(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.RollbackTransaction) {

                resultOperationPromise = phrontService.handleRollbackTransaction(deserializedOperation);

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
                    return self._serializer.serializeObject(operationFailed);
                });
            }
        }
    }
});
