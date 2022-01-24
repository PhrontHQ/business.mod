const   Worker = require("./worker").Worker,
        Identity = require("montage/data/model/identity").Identity,
        IdentityDescriptor = require("montage/data/model/identity.mjson").montageObject,
        AuthorizationPolicy = require("montage/data/service/authorization-policy").AuthorizationPolicy,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    OperationCoordinator = require("../data/main.datareel/service/operation-coordinator").OperationCoordinator,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,

    // Montage = (require)("montage/core/core").Montage,
    currentEnvironment = require("montage/core/environment").currentEnvironment,
    util = require('util');

const successfullResponse = {
        statusCode: 200,
        body: 'Success'
    };

const failedResponse = (statusCode, error) => ({
        statusCode,
        body: error
    });


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * A Worker is any object that can handle messages from a serverless function
 * to implement custom businsess logic
 *
 * @class DataWorker
 * @extends Worker
 */
exports.DataWorker = Worker.specialize( /** @lends DataWorker.prototype */{
    constructor: {
        value: function DataWorker() {
            this.super();

            this._serializer = new MontageSerializer().initWithRequire(this.require);

        }
    },
    operationCoordinator: {
        value: undefined
    },

    _deserializer: {
        value: undefined
    },
    deserializer: {
        get: function() {
            return this._deserializer || (this._deserializer = new Deserializer());
        }
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
                this.operationCoordinator = new OperationCoordinator(this);
            }

            this._mainService.addEventListener(DataOperation.Type.AuthorizeConnectionFailedOperation,this,false);
            this._mainService.addEventListener(DataOperation.Type.AuthorizeConnectionCompletedOperation,this,false);
        }
    },

    /**
     * Parse HTTP accept-language header of the user browser.
     *
     * @param {string} acceptLanguageHeader The string of accept-language header
     * @return {Array} Array of language-quality pairs
     */
    parsedAcceptLanguageHeader: {
        value: function(acceptLanguageHeader, languageOnly) {
            var pairs = acceptLanguageHeader.split(','),
                result = [];

            for (var i=0, countI = pairs.length, pair; (i<countI); i++) {
                pair = pairs[i].split(';');
                if (pair.length == 1) {
                    languageOnly
                        ? result.push( pair[0] )
                        : result.push( [pair[0], '1'] );
                }
                else {
                    languageOnly
                        ? result.push( pair[0] )
                        : result.push( [pair[0], pair[1].split('=')[1] ] );
                }
            }
            return result;
        }
    },

    /**
     * Only the event from connect has headers informations
     *
     * Shouldn't we move that on the DataOperation itself as context instead?
     *
     * @class DataWorker
     * @extends Worker
     */
    setEnvironmentFromEvent: {
        value: function(event) {
            //console.log("setEnvironemntFromEvent: ",event);
            var stage = event.requestContext.stage,
                acceptLanguage = (event.headers && (event.headers["Accept-Language"]||event.headers["accept-language"])),
                userAgent = (event.headers && (event.headers["User-Agent"] || event.headers["user-agent"])) || event.requestContext.identity.userAgent,
                userIp = event.requestContext.identity.sourceIp;

                /*
                    "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
                    or
                    'Accept-Language: en;q=0.8,es;q=0.6,fr;q=0.4'

                    TODO
                    multiValueHeaders["Accept-Language"] is  [ 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7' ]

                    so we can save some parsing there.
                */
                languages = acceptLanguage ? this.parsedAcceptLanguageHeader(acceptLanguage,true) : null;

            //console.log("userAgent: ",userAgent);

            currentEnvironment.stage = stage;
            currentEnvironment.userAgent = userAgent;
            if(languages) {
                currentEnvironment.languages = languages;
            }
            currentEnvironment.userAgentIPAddress = userIp;
            currentEnvironment.clientId = event.requestContext.connectionId;

        }
    },

    handleAuthorize: {
        value: async function(event, context, callback) {

            console.log("handleAuthorize: event:", event, " context:", context, "callback: ", callback);
            // await sleep(6000)

            var base64EncodedSerializedIdentity = event.queryStringParameters.identity,
                serializedIdentity,
                identityPromise, authorizeConnectionOperation,
                self = this;


            if(base64EncodedSerializedIdentity) {
                serializedIdentity = Buffer.from(base64EncodedSerializedIdentity, 'base64').toString('binary');
                this.deserializer.init(serializedIdentity, this.require, /*objectRequires*/undefined, /*module*/undefined, /*isSync*/false);
                try {
                    identityPromise = this.deserializer.deserializeObject();
                } catch (error) {
                    /*
                        If there's a serializedIdentity and we can't deserialize it, we're the ones triggering the fail.
                    */
                    console.error("Error: ",error, " Deserializing ",serializedIdentity);

                    return Promise.resolve(this.responseForEventAuthorization(event, null, false, /*responseContext*/error));

                }

            } else {
                identityPromise = Promise.resolve(null);
            }

            return identityPromise.then(function(identity) {

                console.log("DataWorker handleAuthorize with identity:",identity);
                var identityObjectDescriptor;

                if(!identity) {
                    /*
                        Without any info what to do? If it's a storefront kind of app, anonymous users should always connect, if it's about something more personal, we may want to refuse. MainService has AuthorizationPolicy and should be configured for that, so ideally we don't want to make that decision here. if it's onConnect, and we got nothing, we refuse connection.

                        So we use an Anonymous identity singleton
                    */
                    if(self.mainService.authorizationPolicy === AuthorizationPolicy.OnConnect) {
                        return self.responseForEventAuthorization(event, serializedIdentity, false, null);
                    } else {
                        identity = Identity.AnonymousIdentity;
                        identityObjectDescriptor = IdentityDescriptor;
                    }

                } else {
                    identityObjectDescriptor = self.mainService.objectDescriptorForObject(identity);
                }


                authorizeConnectionOperation = new DataOperation();

                authorizeConnectionOperation.id = event.requestContext.requestId;
                authorizeConnectionOperation.type = DataOperation.Type.AuthorizeConnectionOperation;
                authorizeConnectionOperation.target = identityObjectDescriptor;
                authorizeConnectionOperation.data = identity;
                /*
                    The following 2 lines are in OperationCoordinator as well, when it deserialize client-sent operations. We create connectOperation here as it's not sent by teh client, but by the Gateway itself
                */
                authorizeConnectionOperation.context = event;
                //Set the clientId (in API already)
                authorizeConnectionOperation.clientId = event.requestContext.connectionId;

                self.setEnvironmentFromEvent(event);

                /*
                    Only the event from connect has headers informations, the only moment when we can get accept-language
                    So we need to catch it and store it as we create the connection in the DB.

                    We'll have to start being able to create full-fledge DO for that. If we move saveChanges to DataService,
                    we should be able to use the main service directly? Then the operations created should just be dispatched locally,
                    by whom?

                    That's what shpould probably happen client side as well, where the opertions are dispatched locally and the caught by an object that just push them on the WebSocket.
                */
                return new Promise(function(resolve, reject) {

                    self.handleAuthorizePromiseResolve = resolve;
                    self.handleAuthorizePromiseReject = reject;


                    return self.operationCoordinator.handleOperation(authorizeConnectionOperation, event, context, callback, this.apiGateway);
                })
                .then((authorizeConnectionCompletedOperation) => {
                    /*
                        Identity may have been modified by the authorization logic, so we need to re-serialize
                    */
                    var serializedAuthorizedIdentity = self._serializer.serializeObject(authorizeConnectionCompletedOperation.data);

                    return self.responseForEventAuthorization(event, serializedAuthorizedIdentity, true, null);

                }).catch((error) => {
                    var serializedAuthorizedIdentity = self._serializer.serializeObject(identity);

                    console.error("this.operationCoordinator.handleOperation error:",error);
                    return self.responseForEventAuthorization(event, serializedAuthorizedIdentity, false, error);

                    // callback(failedResponse(500, JSON.stringify(err)))
                });


            });


        }
    },

    handleAuthorizeConnectionCompletedOperation: {
        value: function(authorizeConnectionCompletedOperation) {
            this.handleAuthorizePromiseResolve(authorizeConnectionCompletedOperation);
        }
    },
    handleAuthorizeConnectionFailedOperation: {
        value: function(authorizeConnectionFailedOperation) {
            this.handleAuthorizePromiseReject(authorizeConnectionFailedOperation);
        }
    },

    /**
     * Deserialized an identity from the event.requestContext.authorizer.principalId property, but if it's not there,
     * we would fecth the identity from the database using connectionId
     *
     * @param {object} event The event sent by the API Gateway
     * @return {Promise<Identity>} a Promise of the identity
     */
    authorizerIdentityFromEvent: {
        value: function(event, dataOperation) {

            //console.log("authorizerIdentityFromEvent:", event, dataOperation);

            this.deserializer.init(event.requestContext.authorizer.principalId, this.require, /*objectRequires*/undefined, /*module*/undefined, /*isSync*/false);
            try {
                return this.deserializer.deserializeObject();
            } catch (error) {
                /*
                    If there's a serializedIdentity and we can't deserialize it, we're the ones triggering the fail.
                */
                console.error("Error: ",error, " Deserializing ",serializedIdentity);
                return Promise.reject(error);
            }
        }
    },

    handleConnect: {
        value: function(event, context, callback) {
            var self = this,
                connectOperation = new DataOperation(),
            serializedIdentity = event.requestContext.authorizer.principalId;

            connectOperation.id = event.requestContext.requestId;
            connectOperation.type = DataOperation.Type.ConnectOperation;
            connectOperation.target = this;

            /*
                The following 2 lines are in OperationCoordinator as well, when it deserialize client-sent operations. We create connectOperation here as it's not sent by teh client, but by the Gateway itself
            */
            connectOperation.context = event;
            //Set the clientId (in API already)
            connectOperation.clientId = event.requestContext.connectionId;

            this.setEnvironmentFromEvent(event);

            /*
                Only the event from connect has headers informations, the only moment when we can get accept-language
                So we need to catch it and store it as we create the connection in the DB.

                We'll have to start being able to create full-fledge DO for that. If we move saveChanges to DataService,
                we should be able to use the main service directly? Then the operations created should just be dispatched locally,
                by whom?

                That's what shpould probably happen client side as well, where the opertions are dispatched locally and the caught by an object that just push them on the WebSocket.
            */

            this.authorizerIdentityFromEvent(event, connectOperation)
            .then(function(identity) {
                connectOperation.identity = identity;
                return self.operationCoordinator.handleOperation(connectOperation, event, context, callback, self.apiGateway);
            })
           .then(() => {
               //console.log("DataWorker -handleConnect: operationCoordinator.handleOperation() done");
               callback(null, {
                   statusCode: 200,
                   body: 'Connected.'
               });
           }).catch((err) => {
                console.log(err)
                callback(failedResponse(500, JSON.stringify(err)))
           });

        }
    },

    handleMessage: {
        value: function(event, context, callback) {

            /*
                Add a check if the message isn't coming from the socket, the only other is through the handleCommitTransaction lambda.

                We must only accept things if there's an included conectionId that matches a known connection.

                But is that enough or should we also re-include the identity?
                It doesn't look like

                https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ApiGatewayManagementApi.html#getConnection-property

                returns the context where our serialized identity is stored.
            */

            this.setEnvironmentFromEvent(event);

            var serializedOperation = event.body,
            deserializedOperation,
            objectRequires,
            module,
            isSync = true,
            self = this;

            this.deserializer.init(serializedOperation, this.require, objectRequires, module, isSync);
            try {
                deserializedOperation = this.deserializer.deserializeObject();
            } catch (ex) {
                console.error("No deserialization for ",serializedOperation);
                return Promise.reject("Unknown message: ",serializedOperation);
            }

            //console.debug("DataWorker received: ",deserializedOperation);

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

            /*
                Set the clientId (in API already), if it's there. If we come here from an http post sidekick,
                there won't be one and we'll use the one sent by the client.
            */
            if(event.requestContext && event.requestContext.connectionId) {
                deserializedOperation.clientId = event.requestContext.connectionId;
            }

            //this.operationCoordinator.handleMessage(event, context, callback, this.apiGateway)
            this.authorizerIdentityFromEvent(event, deserializedOperation)
            .then(function(identity) {
                var connectionPromise;

                if(!identity) {
                    throw new Error("Could not find an identity");
                }

                deserializedOperation.identity = identity;

                if(event.httpMethod && event.httpMethod === "POST") {
                    //Get the clientId from the dataOperation:
                    var clientId = deserializedOperation.clientId;

                    if(!clientId) {
                        throw new Error("HTTP Post: Could not find a clientId");
                    }

                    connectionPromise = new Promise(function(resolve, reject) {

                        var params = {
                                ConnectionId: clientId
                            };

                        self.apiGateway.getConnection(params, function(err, data) {
                            if (err) {
                                // an error occurred
                                console.log(err, err.stack);
                                reject(err);
                            }
                            else {
                                /*
                                    data (Object) — the de-serialized data returned from the request. Set to null if a request error occurs. The data object has the following properties:
                                    ConnectedAt — (Date)
                                    The time in ISO 8601 format for when the connection was established.

                                    Identity — (map)
                                    SourceIp — required — (String)
                                    The source IP address of the TCP connection making the request to API Gateway.

                                    UserAgent — required — (String)
                                    The User Agent of the API caller.

                                    LastActiveAt — (Date)
                                    The time in ISO 8601 format for when the connection was last active.
                                */
                                // successful response, we found a connection. We set it on the environment
                                currentEnvironment.clientId = deserializedOperation.clientId;
                                console.log("valid connection found using operation's clientId "+clientId+": ",data);

                                resolve(clientId);
                            }
                        });

                    });
                } else {
                    if(!currentEnvironment.clientId) {
                        throw new Error("Could not find an comnectionId in currentEnvironment.clientId");
                    }
                    connectionPromise = Promise.resolve(currentEnvironment.clientId);
                }

                return connectionPromise;
            })
            .then(function(clientId) {
                /*
                    If we come from http, we're not going to have it from the gateway,
                    But we expect the client to have it
                */
                // if(!currentEnvironment.clientId) {
                //     currentEnvironment.clientId = deserializedOperation.clientId;
                // }
                return self.operationCoordinator.handleOperation(deserializedOperation, event, context, callback, self.apiGateway);
            })
            .then(() => {
                callback(null, successfullResponse)
            })
            .catch((err) => {
                console.error("Error: ",err, " for event: ",event);
                /*
                    JSON.stringify() doesn't handle circular references, util.inspect() does
                */
                callback(failedResponse(500, util.inspect(err)))
            });

        }
    }

});
