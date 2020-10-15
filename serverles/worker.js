var Target = require("montage/core/target").Target,
defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;


/**
 * A Worker is any object that can handle messages from a serverless function
 * to implement custom businsess logic
 *
 * @class Worker
 * @extends Montage
 */
exports.Worker = Target.specialize( /** @lends Worker.prototype */{
    constructor: {
        value: function Worker() {
            this.eventManager = defaultEventManager;
            defaultEventManager.application = this;
        }
    },
    name: {
        value: undefined
    },
    apiGateway: {
        value: undefined
    },

    handleConnect: {
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
            await this.apiGateway.postToConnection({
                ConnectionId: event.requestContext.connectionId,
                Data: event.body
            }).promise();

            cb(null, {
                statusCode: 200,
                body: 'Sent.'
              });
        }
    },

    handleDisconnect: {
        value: function(event, context, cb) {
            cb(null, {
                statusCode: 200,
                body: 'Disconnected.'
            });
        }
    }

});
