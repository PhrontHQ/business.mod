var PhrontService = require("phront-data/data/main.datareel/service/phront-service").PhrontService,
    OperationCoordinator = require("phront-data/data/main.datareel/service/operation-coordinator").OperationCoordinator,
    mainService = require("phront-data/data/main.datareel/main.mjson").montageObject,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    MontageSerializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Deserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer,
    Criteria = require("montage/core/criteria").Criteria,
    Montage = require("montage/core/core").Montage,
    phrontService = mainService.childServices[0],
    types = phrontService.types;


describe("PhrontService -Create Database", function() {

	it("can create the storage for an ObjectDescriptor ", function (done) {

      
        // function importObjectDescriptor(iType) {
        //     console.log("create "+iType.name);
        //     iOperation = new DataOperation();
        //     iOperation.type = DataOperation.Type.Create;
        //     iOperation.data = iType;
            
        //     phrontService.handleCreateOperation(iOperation)
        //     .then(function(createCompletedOperation) {
        //         console.log("createCompletedOperation:",createCompletedOperation.objectDescriptor.name);
        //     },
        //     function(createFailedOperation) {
        //         console.log("createFailedOperation:",createFailedOperation.objectDescriptor.name);
        //     });

        // }


        // for(var i=0, countI = types.length, iType, iOperation;i<countI; i++) {
        //     importObjectDescriptor(types[i]);
        // }
    });
    
    it("can import data for an ObjectDescriptor from another source", function (done) {
        var phrontService = mainService.childServices[0];
            types = phrontService.types;
    });

});


describe("PhrontService -Read data from serialized operations", function() {
    var serializer = new MontageSerializer().initWithRequire(require),
        deserializer = new Deserializer();

/*
  var operation = JSON.parse(event.body),
  objectDescriptorModuleId = operation.objectDescriptor,
  objectDescriptor = phrontService.objectDescriptorForObjectDescriptorModuleId(objectDescriptorModuleId);
  
  operation.dataDescriptor = objectDescriptor;

  console.log("objectDescriptor is ",objectDescriptor);
  console.log("operation is ",operation);


  return phrontService.handleReadOperation(operation) 
  .then(function(readUpdatedOperation) {
    var records = readUpdatedOperation.data;
    console.log("readUpdatedOperation",readUpdatedOperation,records);
    //Having the whole objectDescriptor here creates a circular issue using simple JSON.stringify
    readUpdatedOperation.dataDescriptor = readUpdatedOperation.objectDescriptor.module.id;

    readUpdatedOperation.referrer = operation.id;
    return readUpdatedOperation;    
  });
  */

    //Create a ReadOperation
    var objectDescriptor = phrontService.objectDescriptorWithModuleId("data/main.datareel/model/image");

    console.log("Montage.getInfoForObject(objectDescriptor): ", Montage.getInfoForObject(objectDescriptor));

    readOperation = new DataOperation();
    readOperation.type = DataOperation.Type.Read;
    readOperation.dataDescriptor = objectDescriptor.module.id;
    //readOperation.criteria = new Criteria().initWithSyntax(self.convertSyntax, v)
    readOperation.criteria = new Criteria().initWithExpression("id == $", "1f9bd2d1-e120-4214-8ff1-273fd49c3a14");

    //Serialize operation
    var serializedOperation = serializer.serializeObject(readOperation),
        operationCoordinator = new OperationCoordinator;

        //Simulate the event passed by the socket:
        operationCoordinator.handleEvent({
            "body":serializedOperation
        })
        .then(function(serializedCompletedOperation) {
            console.log("serializedCompletedOperation:",serializedCompletedOperation);
        },
        function(serializedFailedOperation) {
            console.log("serializedFailedOperation:",serializedFailedOperation);
        });



    // //Deserialize operation
    // var deserializedOperation,
    // objectRequires,
    // module,
    // isSync = true;

    // // - objectRequires is an object that contains label->key 
    // // that would be used if a matching label exsists in the serialzation, 
    // // instead of creating a new one
    // deserializer.init(serializedOperation, require, objectRequires, module, isSync);
    // deserializedOperation = deserializer.deserializeObject();

    // console.log("deserializedOperation is ",deserializedOperation);

    // //Execute operation
    // phrontService.handleReadOperation(deserializedOperation)
    // .then(function(readCompletedOperation) {
    //     console.log("readCompletedOperation:",readCompletedOperation.dataDescriptor);

    //     //serialize
    //     var serializedCompletedOperation = serializer.serializeObject(readCompletedOperation);

    //     return serializedCompletedOperation;

    // },
    // function(createFailedOperation) {
    //     console.log("createFailedOperation:",createFailedOperation.objectDescriptor.name);
    // });


});
