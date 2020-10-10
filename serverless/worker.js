var Montage = require("./core").Montage,
OperationCoordinator = require("phront/data/main.datareel/service/operation-coordinator").OperationCoordinator;


/**
 * A Worker is any object that can handle messages from a serverless function
 * to implement custom businsess logic
 *
 * @class Worker
 * @extends Montage
 */
exports.Worker = Montage.specialize( /** @lends Worker.prototype */{
    constructor: {
        value: function Worker() {
            this.operationCoordinator = new OperationCoordinator();
        }
    },
    // deserializeSelf: {
    //     value: function (deserializer) {
    //         var value;
    //         value = deserializer.getProperty("name");
    //         if (value !== void 0) {
    //             this.name = value;
    //         }

    //         value = deserializer.getProperty("apiGateway");
    //         if (value !== void 0) {
    //             this.apiGateway = value;
    //         }
    //     }
    // },
    name: {
        value: undefined
    },
    operationCoordinator: {
        value: undefined
    },
    apiGateway: {
        value: undefined
    },
    _mainService: {
        value: undefined
    },
    /*
        In the context of a worker this is expected to be triggered only once
    */
    mainService: {
        get: function() {
            return this._mainService;
        },
        set: function(value) {
            this._mainService = value;
            if(!this.operationCoordinator) {
                this.operationCoordinator = new OperationCoordinator(value);
            }
        }
    },

    handleOpen: {
        value: function(event, context, cb) {
            cb(null, {
                statusCode: 200,
                body: 'Connected.'
            });
        }
    },

    /* default implementation is just echo */
    handleMessage: {
        value: async function(event, context, cb) {
            await sharedGateway.postToConnection({
                ConnectionId: event.requestContext.connectionId,
                Data: event.body
            }).promise();

            cb(null, {
                statusCode: 200,
                body: 'Sent.'
              });
        }
    },
    handleClose: {
        value: function(event, context, cb) {
            cb(null, {
                statusCode: 200,
                body: 'Disconnected.'
            });
        }
    },

});
