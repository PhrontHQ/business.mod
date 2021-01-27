const Worker = require("./worker").Worker,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

    DataOperation = require("montage/data/service/data-operation").DataOperation,
    OperationCoordinator = require("../data/main.datareel/service/operation-coordinator").OperationCoordinator,
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

    handleConnect: {
        value: function(event, context, callback) {
            var connectOperation = new DataOperation();

            connectOperation.type = DataOperation.Type.Connect;
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
