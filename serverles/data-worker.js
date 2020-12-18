const Worker = require("./worker").Worker,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

    DataOperation = require("montage/data/service/data-operation").DataOperation,
    OperationCoordinator = require("../data/main.datareel/service/operation-coordinator").OperationCoordinator,
    currentEnvironment = require("montage/core/environment").currentEnvironment;


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

    setEnvironemntFromEvent: {
        value: function(event) {
            console.log("setEnvironemntFromEvent: ",event);
            var stage = event.requestContext.stage,
                acceptLanguage = event.headers["Accept-Language"]||event.headers["accept-language"],
                userAgent = event.headers["User-Agent"] || event.headers["user-agent"],
                userIp = event.requestContext.identity.sourceIp;

                /*
                    "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
                    or
                    'Accept-Language: en;q=0.8,es;q=0.6,fr;q=0.4'
                */
                languages = this.parsedAcceptLanguageHeader(acceptLanguage,true);


            currentEnvironment.stage = stage;
            currentEnvironment.userAgent = userAgent;
            currentEnvironment.languages = languages;
            currentEnvironment.userAgentIPAddress = userIp;
            currentEnvironment.clientId = event.requestContext.connectionId;

        }
    },

    handleConnect: {
        value: function(event, context, cb) {
            var connectOperation = new DataOperation();

            connectOperation.type = DataOperation.Type.Connect;
            connectOperation.target = this;

            /*
                The following 2 lines are in OperationCoordinator as well, when it deserialize client-sent operations. We create connectOperation here as it's not sent by teh client, but by the Gateway itself
            */
            connectOperation.context = event;
            //Set the clientId (in API already)
            connectOperation.clientId = event.requestContext.connectionId;

            this.setEnvironemntFromEvent(event);
            this.operationCoordinator.handleOperation(connectOperation, event, context, cb, this.apiGateway);

            cb(null, {
                statusCode: 200,
                body: 'Connected.'
            });
        }
    },

    /* default implementation is just echo */
    handleMessage: {
        value: async function(event, context, cb) {

            this.setEnvironemntFromEvent(event);
            await this.operationCoordinator.handleMessage(event, context, cb, this.apiGateway);

            cb(null, {
              statusCode: 200,
              body: 'Sent.'
            });
        }
    }

});
