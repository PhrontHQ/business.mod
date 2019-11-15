if(global && typeof global.XMLHttpRequest === undefined) {
    global.XMLHttpRequest = require('xhr2');
}
var Montage = require("montage/core/core").Montage,
MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
DataOperation = require("montage/data/service/data-operation").DataOperation,
phrontService = require("data/main.datareel/main.mjson").montageObject.childServices[0];


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

    handleEvent: {
        value: function(event, context) {
            
            var serializedOperation = event.body,
                objectRequires,
                module,
                isSync = true,
                resultOperatationPromise,
                self = this;
        
            this._deserializer.init(serializedOperation, require, objectRequires, module, isSync);
            deserializedOperation = this._deserializer.deserializeObject();
            if(deserializedOperation.type ===  DataOperation.Type.Read) {
                resultOperatationPromise = phrontService.handleReadOperation(deserializedOperation);
            }
            else if(deserializedOperation.type ===  DataOperation.Type.Update) {
                resultOperatationPromise = phrontService.handleUpdateOperation(deserializedOperation);
            }
            else if(deserializedOperation.type ===  DataOperation.Type.Create) {
                resultOperatationPromise = phrontService.handleCreateOperation(deserializedOperation);
            }
            else {
                console.error("OperationCoordinator not programmed to handle type of operation ",deserializedOperation);
                resultOperatationPromise = Promise.reject(null);
            }

            return resultOperatationPromise.then(function(operationCompleted) {
                //serialize
                return self._serializer.serializeObject(operationCompleted);

            },function(operationFailed) {
                //serialize
                return self._serializer.serializeObject(operationFailed);
            });
        
        }
    }
});
