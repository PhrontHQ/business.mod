// if(global && typeof global.XMLHttpRequest === undefined) {
//     global.XMLHttpRequest = require('xhr2');
// }
var Montage = require("montage/core/core").Montage,
MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
DataOperation = require("montage/data/service/data-operation").DataOperation,
phrontService = require("data/main.datareel/main.mjson").montageObject.childServices[0],
DataOperation = require("montage/data/service/data-operation").DataOperation,
sizeof = require('object-sizeof');


exports.OperationCoordinator = Montage.specialize(/** @lends OperationCoordinator.prototype */ {

    /***************************************************************************
     * Constructor
     */

    constructor: {
        value: function OperationCoordinator() {
            this._serializer = new MontageSerializer().initWithRequire(require);
            this._deserializer = new Deserializer();

            return this;
        }
    },

    MAX_PAYLOAD_SIZE: {
        value: 63
    },

    dispatchOperationToConnectionClientId: {
        value: function(operation,connection,clientId) {
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

        var serializedHandledOperation = await operationCoordinator.handleEvent(event, context, cb, client);

    */
    handleEvent: {
        value: function(event, context, callback, gatewayClient) {
            
            var serializedOperation = event.body,
                objectRequires,
                module,
                isSync = true,
                resultOperationPromise,
                self = this;
        
            this._deserializer.init(serializedOperation, require, objectRequires, module, isSync);
            deserializedOperation = this._deserializer.deserializeObject();
            //console.log("handleEvent(...)",deserializedOperation);

            if(deserializedOperation.type ===  DataOperation.Type.Read) {

                resultOperationPromise = phrontService.handleReadOperation(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.Update) {

                resultOperationPromise = phrontService.handleUpdateOperation(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.Create) {

                resultOperationPromise = phrontService.handleCreateOperation(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.Delete) {

                resultOperationPromise = phrontService.handleDeleteOperation(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.CreateTransaction) {

                resultOperationPromise = phrontService.handleCreateTransactionOperation(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.Batch) {

                resultOperationPromise = phrontService.handleBatchOperation(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.PerformTransaction) {

                resultOperationPromise = phrontService.handlePerformTransactionOperation(deserializedOperation);

            } else if(deserializedOperation.type ===  DataOperation.Type.RollbackTransaction) {

                resultOperationPromise = phrontService.handleRollbackTransactionOperation(deserializedOperation);

            } else {
                console.error("OperationCoordinator: not programmed to handle type of operation ",deserializedOperation);
                resultOperationPromise = Promise.reject(null);
            }

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
});
