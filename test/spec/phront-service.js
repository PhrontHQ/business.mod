var PhrontService = require("phront/data/main.datareel/service/phront-service").PhrontService,
    OperationCoordinator = require("phront/data/main.datareel/service/operation-coordinator").OperationCoordinator,
    mainService = require("phront/data/main.datareel/main.mjson").montageObject,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    Criteria = require("montage/core/criteria").Criteria,
    //DataStream = require("montage/data/service/data-stream").DataStream,
    //DataQuery = require("montage/data/model/data-query").DataQuery,
    Montage = require("montage/core/core").Montage,
    //to test client side
    //clientMainService = require("../data/client-main.datareel/main.mjson").montageObject,
    //ClientCollection = require("phront/data/main.datareel/model/collection").Collection,
    //operationCoordinator = new OperationCoordinator,
    phrontService = mainService.childServices[0],
    //sphrontClientService = clientMainService.childServices[0],
    types = phrontService.types;



//Hack phrontClientService and Augment operationCoordinator for tests,
//making it assume the role of the WebSocket for phrontClientService
/*
phrontClientService._socketOpenPromise = Promise.resolve(true);
operationCoordinator.send = function(serializedOperation) {
    this.handleEvent({
        "body":serializedOperation
    })
    .then(function(serializedHandledOperation) {
        phrontClientService.handleMessage({data:serializedHandledOperation});
    },function(error) {
        console.error(error);
    });
}
phrontClientService._socket = operationCoordinator;
*/

describe("PhrontService -Create Database", function() {

	it("can create the storage for an ObjectDescriptor ", function (done) {


        function importObjectDescriptor(iType) {
            console.log("create "+iType.name);
            iOperation = new DataOperation();
            iOperation.type = DataOperation.Type.Create;
            iOperation.data = iType;

            phrontService.handleCreate(iOperation)
            .then(function(createCompletedOperation) {
                console.log("createCompletedOperation:",createCompletedOperation.objectDescriptor.name);
            },
            function(createFailedOperation) {
                console.log("createFailedOperation:",createFailedOperation.objectDescriptor.name);
            });

        }


        for(var i=0, countI = types.length, iType, iOperation;i<countI; i++) {
            importObjectDescriptor(types[i]);
        }
    });

    // it("can import data for an ObjectDescriptor from another source", function (done) {
    //     var phrontService = mainService.childServices[0];
    //         types = phrontService.types;
    // });

});


describe("PhrontService -Read data from serialized operations", function() {
    var serializer = new MontageSerializer().initWithRequire(require),
        deserializer = new Deserializer();

        it("can feth an image from an id without OperationCoordinator", function (done) {
            //Create a ReadOperation
            var objectDescriptor = phrontService.objectDescriptorWithModuleId("data/main.datareel/model/image");

            //This ends up calling module-object-descriptor.js:149 - getObjectDescriptorWithModuleId()
            //which causes node to try to phront/node_modules/montage/core/meta/module-object-descriptor.mjson
            //whih is bogus....
            //console.log("Montage.getInfoForObject(objectDescriptor): ", Montage.getInfoForObject(objectDescriptor));

            readOperation = new DataOperation();
            readOperation.type = DataOperation.Type.Read;
            readOperation.dataDescriptor = objectDescriptor.module.id;
            readOperation.criteria = new Criteria().initWithExpression("id == $", "1f9bd2d1-e120-4214-8ff1-273fd49c3a14");

            //Serialize operation
            var serializedOperation = serializer.serializeObject(readOperation),
                deserializedOperation,
                objectRequires,
                module,
                isSync = true,
                resultOperatationPromise,
                self = this,
                completedSerializedOperation;

            deserializer.init(serializedOperation, require, objectRequires, module, isSync);
            deserializedOperation = deserializer.deserializeObject();

            return phrontService.handleRead(deserializedOperation)
            .then(function(operationCompleted) {
                //serialize
                completedSerializedOperation = serializer.serializeObject(operationCompleted);
                console.log("completedSerializedOperation:",completedSerializedOperation);




            },function(operationFailed) {
                //serialize
                return self._serializer.serializeObject(operationFailed);
            });

        });


        // it("can feth an image from an id ", function (done) {
        //     //Create a ReadOperation
        //     var objectDescriptor = phrontService.objectDescriptorWithModuleId("data/main.datareel/model/image");

        //     //console.log("Montage.getInfoForObject(objectDescriptor): ", Montage.getInfoForObject(objectDescriptor));

        //     readOperation = new DataOperation();
        //     readOperation.type = DataOperation.Type.Read;
        //     readOperation.dataDescriptor = objectDescriptor.module.id;
        //     readOperation.criteria = new Criteria().initWithExpression("id == $", "1f9bd2d1-e120-4214-8ff1-273fd49c3a14");

        //     //Serialize operation
        //     var serializedOperation = serializer.serializeObject(readOperation),
        //         operationCoordinator = new OperationCoordinator;

        //     //Simulate the event passed by the socket:
        //     operationCoordinator.handleEvent({
        //         "body":serializedOperation
        //     })
        //     .then(function(serializedCompletedOperation) {
        //             // //Deserialize operation
        //             var deserializedOperation,
        //             objectRequires,
        //             module,
        //             isSync = true;

        //             deserializer.init(serializedCompletedOperation, require, objectRequires, module, isSync);
        //             deserializedOperation = deserializer.deserializeObject();

        //         console.log("deserializedOperation:",deserializedOperation);

        //     },
        //     function(serializedFailedOperation) {
        //         console.log("serializedFailedOperation:",serializedFailedOperation);
        //     });
        // });


        // it("can feth a collection and its products", function (done) {

        //     return new Promise(function(resolve,reject) {


        //         var collectionQuery = DataQuery.withTypeAndCriteria(ClientCollection),
        //             collectionDataStream =  new DataStream();


        //         collectionDataStream.query = collectionQuery;

        //         clientMainService.fetchData(
        //             collectionQuery,
        //             null,
        //             collectionDataStream
        //         ).then(
        //             function (collections) {
        //                 console.log("collections: collections");
        //                 resolve(collections);
        //             },
        //             function (error) {
        //                 reject(error);
        //             }
        //         );
        //     })
        //     .then(function(collections) {
        //         expect(Array.isArray(collections)).toBe(true);
        //         done();
        //     },function(error) {
        //         console.error(error);
        //         done();
        //     });

        // });


});
