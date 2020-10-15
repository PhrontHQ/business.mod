const Worker = require("./worker").Worker,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

    DataOperation = require("montage/data/service/data-operation").DataOperation,
    OperationCoordinator = require("../data/main.datareel/service/operation-coordinator").OperationCoordinator;


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
            await this.operationCoordinator.handleMessage(event, context, cb, this.apiGateway);

            cb(null, {
              statusCode: 200,
              body: 'Sent.'
            });
        }
    }

});
