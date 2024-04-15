var PostgreSQLClientPool = require("../postgre-s-q-l-client-pool").PostgreSQLClientPool

    DataOperation = require("montage/data/service/data-operation").DataOperation,
    DataOperationErrorNames = require("montage/data/service/data-operation").DataOperationErrorNames,
    DataOperationType = require("montage/data/service/data-operation").DataOperationType;


var AuroraV1PostgreSQLClientPool = exports.AuroraV1PostgreSQLClientPool = PostgreSQLClientPool.specialize({

    /***************************************************************************
     * Serialization
     */

        deserializeSelf: {
            value: function (deserializer) {
                this.super(deserializer);

                // var value = deserializer.getProperty("clientPool");
                // if (value) {
                //     this.connectionDescriptor = value;
                // }

            }
        },

        rawClientPromises: {
            get: function () {
                var promises = this.super();

                // if(!currentEnvironment.isAWS) {
                //     promises.push(
                //         require.async("@aws-sdk/credential-provider-ini").then(function(exports) { fromIni = exports.fromIni})
                //     )
                // };
                promises.push(
                    require.async("@aws-sdk/client-rds-data/dist-cjs/RDSDataClient").then(function(exports) { RDSDataClient = exports.RDSDataClient})
                );
                promises.push(
                    require.async("@aws-sdk/client-rds-data/dist-cjs/commands/BatchExecuteStatementCommand").then(function(exports) { BatchExecuteStatementCommand = exports.BatchExecuteStatementCommand})
                );
                promises.push(
                    require.async("@aws-sdk/client-rds-data/dist-cjs/commands/BeginTransactionCommand").then(function(exports) { BeginTransactionCommand = exports.BeginTransactionCommand})
                );
                promises.push(
                    require.async("@aws-sdk/client-rds-data/dist-cjs/commands/CommitTransactionCommand").then(function(exports) { CommitTransactionCommand = exports.CommitTransactionCommand})
                );
                promises.push(
                    require.async("@aws-sdk/client-rds-data/dist-cjs/commands/ExecuteStatementCommand").then(function(exports) {
                        ExecuteStatementCommand = exports.ExecuteStatementCommand
                    })
                );
                promises.push(
                    require.async("@aws-sdk/client-rds-data/dist-cjs/commands/RollbackTransactionCommand").then(function(exports) { RollbackTransactionCommand = exports.RollbackTransactionCommand})
                );

                // this.__rdsDataClientPromise = Promise.all(promises).then(() => { return this.rawClient;});

                return promises;
            }
        },


    /**
     * Allows subclasses to have multiple specialized pools.
     * For example, AWS Aurora v2 exposes a read only endpoint and a read-write endpoint.
     * @param {DatOperation} dataOperation. The data operation for which we need a clientPool to handle it.

     *
     * @type {PostgreSQLClientPool}
     */

    connectForDataOperation: {
        value: function(dataOperation) {
            if(dataOperation.type === DataOperation.Type.ReadOperation) {
                return this.readOnlyClientPool.connect;
            } else {
                return this.readWriteClientPool.connect;
            }

        }
    }


});
