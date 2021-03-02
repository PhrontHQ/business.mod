const Worker = require("./worker").Worker,
        defaultEventManager = require("montage/core/event/event-manager").defaultEventManager,
        Identity = require("montage/data/model/identity").Identity,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    OperationCoordinator = require("../data/main.datareel/service/operation-coordinator").OperationCoordinator,
    uuid = require("montage/core/uuid"),
    currentEnvironment = require("montage/core/environment").currentEnvironment;

const successfullResponse = {
        statusCode: 200,
        body: 'Success'
    };

const failedResponse = (statusCode, error) => ({
        statusCode,
        body: error
    });

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
        value: function(event, context, callback) {

            var serializedIdentity = event.queryStringParameters.identity,
                identity, authorizeConnectionOperation;


            if(serializedIdentity) {
                this.deserializer.init(serializedIdentity, require, /*objectRequires*/undefined, /*module*/undefined, /*isSync*/true);
                try {
                    identity = this.deserializer.deserializeObject();
                } catch (error) {
                    /*
                        If there's a serializedIdentity and we can't deserialize it, we're the ones triggering the fail.
                    */
                    console.error("Error: ",error, " Deserializing ",serializedIdentity);
                    // return Promise.reject("Unknown message: ",serializedOperation);

                    // var authorizeConnectionFailedOperation = new DataOperation();
                    // authorizeConnectionFailedOperation.id = uuid.generate();
                    // authorizeConnectionFailedOperation.referrerId = event.requestContext.requestId;
                    // authorizeConnectionFailedOperation.type = DataOperation.Type.AuthorizeConnectionFailedOperation;

                    // authorizeConnectionFailedOperation.target = this;

                    return Promise.resolve(this.responseForEventAuthorization(event, false, /*responseContext*/error));

                }
            }

            if(!identity) {
                /*
                    Without any info what to do? If it's a storefront kind of app, anonymous users should always connect, if it's about something more personal, we may want to refuse. MainService has AuthorizationPolicy and should be configured for that, so ideally we don't want to make that decision here.

                    So we use an Anonymous identity singleton
                */
               identity = Identity.AnonymousIdentity;
            }

            authorizeConnectionOperation = new DataOperation();

            authorizeConnectionOperation.id = event.requestContext.requestId;
            authorizeConnectionOperation.type = DataOperation.Type.AuthorizeConnectionOperation;
            authorizeConnectionOperation.target = identity;
            /*
                The following 2 lines are in OperationCoordinator as well, when it deserialize client-sent operations. We create connectOperation here as it's not sent by teh client, but by the Gateway itself
            */
           authorizeConnectionOperation.context = event;
            //Set the clientId (in API already)
            authorizeConnectionOperation.clientId = event.requestContext.connectionId;

            this.setEnvironmentFromEvent(event);

            /*
                Only the event from connect has headers informations, the only moment when we can get accept-language
                So we need to catch it and store it as we create the connection in the DB.

                We'll have to start being able to create full-fledge DO for that. If we move saveChanges to DataService,
                we should be able to use the main service directly? Then the operations created should just be dispatched locally,
                by whom?

                That's what shpould probably happen client side as well, where the opertions are dispatched locally and the caught by an object that just push them on the WebSocket.
            */

           return this.operationCoordinator.handleOperation(authorizeConnectionOperation, event, context, callback, this.apiGateway)
           .then(() => {

                return this.responseForEventAuthorization(event, true, null);

           }).catch((error) => {
                console.error("this.operationCoordinator.handleOperation error:",error);
                return this.responseForEventAuthorization(event, false, error);

                // callback(failedResponse(500, JSON.stringify(err)))
           });
        }
    },

    handleConnect: {
        value: function(event, context, callback) {
            var connectOperation = new DataOperation();

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

           this.operationCoordinator.handleOperation(connectOperation, event, context, callback, this.apiGateway)
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

    /* default implementation is just echo */
    handleMessage: {
        value: function(event, context, callback) {

            this.setEnvironmentFromEvent(event);
            this.operationCoordinator.handleMessage(event, context, callback, this.apiGateway)
            .then(() => {
                callback(null, successfullResponse)
            })
            .catch((err) => {
                console.log(err)
                callback(failedResponse(500, JSON.stringify(err)))
            });

        }
    }

});
