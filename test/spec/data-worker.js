debugger;

var Montage = require("mod/montage"),
    PATH = require("path"),
    DataOperation, DataStream, mainService, DataQuery, Criteria, OperationCoordinator, operationCoordinator,
    uuid = require("mod/core/uuid"),
    Promise = require("mod/core/promise").Promise,
    bootstrapPromise;

console.log("Montage:",Montage);

//From Montage
//Load package
bootstrapPromise = Montage.loadPackage(PATH.join(__dirname, "."), {
    mainPackageLocation: PATH.join(__filename, ".")
})
// //Preload montage to avoid montage-testing/montage to be loaded
.then(function (mr) {
    console.log("mr:",mr);
    var dependenciesPromises = [];

    dependenciesPromises.push(mr.async("mod/data/service/data-operation"));
    dependenciesPromises.push(mr.async("mod/data/service/data-stream"));
    dependenciesPromises.push(mr.async("data/main.mjson"));
    dependenciesPromises.push(mr.async("mod/data/model/data-query"));
    dependenciesPromises.push(mr.async("mod/core/criteria"));
    dependenciesPromises.push(mr.async("data/service/operation-coordinator"));

    return Promise.all(dependenciesPromises);
})
.then(function(resolvedValues) {
    DataOperation = resolvedValues[0].DataOperation;
    DataStream = resolvedValues[1].DataStream;
    mainService = resolvedValues[2].montageObject;
    DataQuery = resolvedValues[3].DataQuery;
    Criteria = resolvedValues[4].Criteria;
    OperationCoordinator = resolvedValues[5].OperationCoordinator;
    operationCoordinator = new OperationCoordinator;

    return [DataOperation,DataStream,mainService, DataQuery, Criteria, OperationCoordinator];
},function(rejectError) {
    console.error(rejectError);
    throw rejectError;
})
.then(function(value) {
    var mockGateway =  {
        postToConnection: function(params) {
                this._promise = new Promise(function(resolve,reject) {
                    /* params looks like:
                        {
                            ConnectionId: event.requestContext.connectionId,
                            Data: self._serializer.serializeObject(readOperationCompleted)
                        }
                    */
                var serializedHandledOperation = params.Data;
                postMessage(serializedHandledOperation);
                resolve(true);

                });
                return this;
            },
            promise: function() {
                return this._promise;
            }
        };


    onmessage = function (ev) {
        var serializedOperation = ev.data;

        var mockContext,
        mockCallback;

        operationCoordinator.handleMessage({
            requestContext: {
                connectionId: uuid.generate()
            },
            "body": serializedOperation
        }, mockContext, mockCallback, mockGateway);
    };

    postMessage({DataWorkerReady:true});


},function(rejectError) {
    console.error(rejectError);
    postMessage({DataWorkerError: rejectError});
    Promise.reject(rejectError);
});
