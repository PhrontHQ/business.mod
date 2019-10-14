var PhrontService = require("phront-data/data/main.datareel/service/phront-service").PhrontService,
    mainService = require("phront-data/data/main.datareel/main.mjson").montageObject,
    DataOperation = require("montage/data/service/data-operation").DataOperation;

describe("A PhrontService", function() {

	it("can create the storage for an ObjectDescriptor ", function (done) {
        var phrontService = mainService.childServices[0];
            types = phrontService.types;



        phrontService.schema = "public";


        phrontService.query("select * from phront.\"Collection\"");


        for(var i=0, countI = types.length, iType, iOperation;i<countI; i++) {
            iType = types[i];

            iOperation = new DataOperation();
            iOperation.type = DataOperation.Type.Create;
            iOperation.data = iType;
            
            phrontService.handleCreateOperation(iOperation);

        }
	});
});
