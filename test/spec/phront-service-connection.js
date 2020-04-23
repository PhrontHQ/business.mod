var Worker = require("tiny-worker"),
    dataWorker = new Worker(__dirname+"data-worker.js",[],{ stdio: 'pipe', execArgv: [] }),
    // data_worker = require("./data-worker"),
    /*
        !!! There's a pbm because 2 RawDataService, clientMainService(client) and mainService (server) are in the same memory space. The first one takes the tiggers on the prototype, so loading clientMainService first.
    */
    clientMainService = require("phront/test/data/client-main.datareel/main.mjson").montageObject,
    //to test client side
    Promise = require("montage/core/promise").Promise,
    phrontClientService = clientMainService.childServices[0],
    pseudoSocket = {
        send: function(serializedOperation) {
            dataWorker.postMessage(serializedOperation);
        }
    };

phrontClientService._socket = pseudoSocket;

//New promise that phrontClientService needs to knoow when to proceed.
phrontClientService._socketOpenPromise = new Promise(function(resolve, reject) {
    dataWorker._resolve = resolve;
    dataWorker._reject = reject;
});

dataWorker.onmessage = function (ev) {
    if(ev.data.DataWorkerReady=== true) {
        dataWorker._resolve(true);
    } else if(typeof ev.data.DataWorkerError !== "undefined") {
        dataWorker._reject(ev.data.DataWorkerError);
    } else {
        phrontClientService.handleMessage(ev);
    }
//dataWorker.terminate();
};
dataWorker.onerror = function (error) {
    console.error(error);
//dataWorker.terminate();
};

//dataWorker.postMessage("{ping:'ping'}");


exports.promise = phrontClientService._socketOpenPromise;
