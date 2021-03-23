var Target = require("montage/core/target").Target,
defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
Montage = require("montage/core/core").Montage;


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

    _require: {
        value: undefined
    },

    require: {
        get: function() {
            return this._require || (this._require = Montage.getInfoForObject(this).require);
        }
    },



    /**
     * Walks a criteria's syntactic tree to assess if one of more an expression
     * involving propertyName.
     *
     * @method
     * @argument {AWS API Gateway Event} event - an event representing the request coming through the API Gateway.
     * @argument {boolean} authorization - a boolean stated wether connection is authorized or not.
     * @argument {responseContext} responseContext - context property on the authorization response.
     *
     * @returns {boolean} - boolean wether the criteri qualifies a value on propertyName.
     */

    responseForEventAuthorization: {
        value: function(event, authorization, responseContext) {
            var response = {
                "principalId": "me",
                "policyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                        "Action": "execute-api:Invoke",
                        "Effect": authorization ? "Allow" : "Deny",
                        "Resource": event.methodArn
                        }
                    ]
                }
            };

            if(responseContext) {
                response.context =  responseContext;
            }
            return response;
        }
    },

    /**
     * Holds the resolve function for the current authorize flow.
     *
     * @property {function}
     */
    handleAuthorizePromiseResolve: {
        value: undefined
    },

    /**
     * Holds the reject function for the current authorize flow.
     *
     * @property {function}
     */
     handleAuthorizePromiseReject: {
        value: undefined
    },

    handleAuthorize: {
        value: function(event, context, callback) {

        }
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
