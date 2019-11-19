// if(global && typeof global.XMLHttpRequest === undefined) {
//     global.XMLHttpRequest = require('xhr2');
// }
var Montage = require("montage/core/core").Montage,
MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
DataOperation = require("montage/data/service/data-operation").DataOperation,
phrontService = require("data/main.datareel/main.mjson").montageObject.childServices[0],
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

    /*

        var serializedHandledOperation = await operationCoordinator.handleEvent(event, context, cb, client);

    */
    handleEvent: {
        value: function(event, context, callback, gatewayClient) {
            
            var serializedOperation = event.body,
                objectRequires,
                module,
                isSync = true,
                resultOperatationPromise,
                self = this;
        
            this._deserializer.init(serializedOperation, require, objectRequires, module, isSync);
            deserializedOperation = this._deserializer.deserializeObject();
            if(deserializedOperation.type ===  DataOperation.Type.Read) {
                return phrontService.handleReadOperation(deserializedOperation)
                .then(function(readOperationCompleted) {
                    //We need to assess the size of the data returned.
                    //serialize
                    var operationDataKBSize = sizeof(readOperationCompleted) / 1024;
                    if(operationDataKBSize < 128) {
                        return gatewayClient
                        .postToConnection({
                            ConnectionId: event.requestContext.connectionId,
                            Data: self._serializer.serializeObject(readOperationCompleted)
                        })
                        .promise();
                    }
                    else {
                        console.error("readOperationCompleted is "+operationDataKBSize+"KB, need to split:");
                    }
    
                },function(readOperationFailed) {
                    console.error("OperationCoordinator: resultOperatationPromise failed ",readOperationFailed);
                    return self._serializer.serializeObject(readOperationFailed);
                });
            }
            else if(deserializedOperation.type ===  DataOperation.Type.Update) {
                resultOperatationPromise = phrontService.handleUpdateOperation(deserializedOperation);
            }
            else if(deserializedOperation.type ===  DataOperation.Type.Create) {
                resultOperatationPromise = phrontService.handleCreateOperation(deserializedOperation);
            }
            else {
                console.error("OperationCoordinator: not programmed to handle type of operation ",deserializedOperation);
                resultOperatationPromise = Promise.reject(null);
            }

            return resultOperatationPromise.then(function(operationCompleted) {
                //serialize
                return self._serializer.serializeObject(operationCompleted);

            },function(operationFailed) {
                console.error("OperationCoordinator: resultOperatationPromise failed ",operationFailed);
                return self._serializer.serializeObject(operationFailed);
            });
        
        }
    }
});
