var PostgreSQLClientPool = require("../postgre-s-q-l-client-pool").PostgreSQLClientPool

    DataOperation = require("montage/data/service/data-operation").DataOperation,
    DataOperationErrorNames = require("montage/data/service/data-operation").DataOperationErrorNames,
    DataOperationType = require("montage/data/service/data-operation").DataOperationType,
    ReadWritePostgreSQLClientPool = undefined,
    ReadOnlyPostgreSQLClientPool = undefined;


var AuroraV2PostgreSQLClientPool = exports.AuroraV2PostgreSQLClientPool = PostgreSQLClientPool.specialize({

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

        readWriteEndoint: {
            get: function() {
                return this.connection.readWriteEndpoint;
            }
        },

        readOnlyEndpoints: {
            get: function() {
                return this.connection.readOnlyEndpoints;
            }
        },

        _createSharedReadWriteClientPool: {
            value: function() {
                var connectionOptions = {
                    host: this.readWriteEndoint.endpoint,
                    port: this.databaseCredentials.value.port,
                    user: this.databaseCredentials.value.username,
                    // database: this.databaseCredentials.value.dbClusterIdentifier,
                    database: this.connection.database,
                    password: this.databaseCredentials.value.password
                };

                //console.debug("connectionOptions: ",connectionOptions);

                return new this.constructor.rawPostgreSQLClientPool(connectionOptions);
            }
        },

        readWriteClientPool: {
            get: function() {
                return ReadWritePostgreSQLClientPool || (
                    global._ReadWritePostgreSQLClientPool
                        ? (ReadWritePostgreSQLClientPool = global._ReadWritePostgreSQLClientPool)
                        : (ReadWritePostgreSQLClientPool = global._ReadWritePostgreSQLClientPool = this._createSharedReadWriteClientPool())
                )
            }
        },

        /*
            WIP: We need to asses how to use a single dedicated reader vs more than one with special purpose?

            This is only expecting one reader, when we need more than one, then we'll need to loop on
                this.readOnlyEndpoints
            and create an array of readOnlyClientPools
        */

        _createSharedReadOnlyClientPool: {
            value: function() {
                var connectionOptions = {
                    host: this.readOnlyEndpoints[0].endpoint,
                    port: this.databaseCredentials.value.port,
                    user: this.databaseCredentials.value.username,
                    // database: this.databaseCredentials.value.dbClusterIdentifier,
                    database: this.connection.database,
                    password: this.databaseCredentials.value.password
                };

                //console.debug("connectionOptions: ",connectionOptions);

                return new this.constructor.rawPostgreSQLClientPool(connectionOptions);
            }
        },

        readOnlyClientPool: {
            get: function() {
                return ReadOnlyPostgreSQLClientPool || (
                    global._ReadOnlyPostgreSQLClientPool
                        ? (ReadOnlyPostgreSQLClientPool = global._ReadOnlyPostgreSQLClientPool)
                        : (ReadOnlyPostgreSQLClientPool = global._ReadOnlyPostgreSQLClientPool = this._createSharedReadOnlyClientPool())
                )
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
        value: function(dataOperation, callback) {
            if(dataOperation.type === DataOperation.Type.ReadOperation) {
                return this.readOnlyClientPool.connect(callback);
            } else {
                return this.readWriteClientPool.connect(callback);
            }

        }
    }


});
