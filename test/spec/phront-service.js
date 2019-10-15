var PhrontService = require("phront-data/data/main.datareel/service/phront-service").PhrontService,
    mainService = require("phront-data/data/main.datareel/main.mjson").montageObject,
    DataOperation = require("montage/data/service/data-operation").DataOperation;

describe("A PhrontService", function() {

	it("can create the storage for an ObjectDescriptor ", function (done) {
        var phrontService = mainService.childServices[0];
            types = phrontService.types;



        //phrontService.schema = "public";


        // phrontService.query("select * from phront.\"Collection\"");
        var createTableSQL1 = `
                CREATE TABLE phront."Collection2"
                (
                    id uuid NOT NULL DEFAULT phront.gen_random_uuid(),
                    title character varying COLLATE pg_catalog."default",
                    description character varying COLLATE pg_catalog."default",
                    "descriptionHtml" text COLLATE pg_catalog."default",
                    "productsArray" uuid[],
                    CONSTRAINT "Collection2_pkey" PRIMARY KEY (id)
                )
                WITH (
                    OIDS = FALSE
                )
                TABLESPACE pg_default;

                ALTER TABLE phront."Collection2"
                    OWNER to postgres;`,
            createTableSQL2 = `
            CREATE TABLE phront."ProductVariantPricePair"
        (
          id uuid NOT NULL DEFAULT phront.gen_random_uuid(),
          CONSTRAINT "ProductVariantPricePair_pkey" PRIMARY KEY (id),
compareAtPrice uuid,
price uuid

        )
        WITH (
            OIDS = FALSE
        )
        TABLESPACE pg_default;

        ALTER TABLE phront."ProductVariantPricePair"
            OWNER to postgres;
            `,
            select_CollectionSQL = "select * from phront.\"_Collection\"";

        var rawDataOperationRoot = {
                resourceArn: "arn:aws:rds:us-west-2:537014313177:cluster:storephront-database", // required
                secretArn: "arn:aws:secretsmanager:us-west-2:537014313177:secret:storephront-database-postgres-user-access-QU2fSB", // required
            },
            rawDataOperationRDB,
            rawDataOperationStatement,
            rawDataOperation = {
            resourceArn: "arn:aws:rds:us-west-2:537014313177:cluster:storephront-database", // required
            secretArn: "arn:aws:secretsmanager:us-west-2:537014313177:secret:storephront-database-postgres-user-access-QU2fSB", // required
            database: 'postgres',
            schema: 'phront',
            sql: createTableSQL2, // required
            continueAfterTimeout: false,
            includeResultMetadata: true
          };

          rawDataOperationRDB = Object.create(rawDataOperationRoot),
          rawDataOperationRDB.database = 'postgres';
          rawDataOperationRDB.schema = 'phront';

          rawDataOperationStatement = Object.create(rawDataOperationRDB),
          rawDataOperationStatement.sql = createTableSQL2; // required
          rawDataOperationStatement.continueAfterTimeout = false;
          rawDataOperationStatement.includeResultMetadata = true;



      
          phrontService._executeStatement(rawDataOperation, function(err, data) {
            if (err) {
                console.log(err, err.stack, rawDataOperationStatement); // an error occurred
            }
            else {
                console.log(data);           // successful response
            }    
          });
      


        for(var i=0, countI = types.length, iType, iOperation;i<countI; i++) {
            iType = types[i];

            iOperation = new DataOperation();
            iOperation.type = DataOperation.Type.Create;
            iOperation.data = iType;
            
            phrontService.handleCreateOperation(iOperation);
        }
    });
    
    it("can import data for an ObjectDescriptor from another source", function (done) {
        var phrontService = mainService.childServices[0];
            types = phrontService.types;
    });

});
