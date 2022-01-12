var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
fromIni,
AWSRawDataService;


/**
* TODO: Document
*
* @class
* @extends RawDataService
*/
exports.AWSRawDataService = AWSRawDataService = RawDataService.specialize(/** @lends PhrontService.prototype */ {
    constructor: {
        value: function AWSRawDataService() {
            RawDataService.call(this);
            return this;
        }
    },

    apiVersion: {
        value: undefined
    },

    _awsClientPromises: {
        value: undefined
    },

    awsClientPromises: {
        get: function () {
            if (!this._awsClientPromises) {
                var promises = this._awsClientPromises = [];

                if(!this.currentEnvironment.isAWS) {
                    promises.push(
                        require.async("@aws-sdk/credential-provider-ini").then(function(exports) { fromIni = exports.fromIni})
                    )
                };

            }
            return this._awsClientPromises;
        }
    },

    _awsClientPromise: {
        value: undefined
    },

    awsClientPromise: {
        get: function () {
            if (!this._awsClientPromise) {
                this._awsClientPromise = Promise.all(this.awsClientPromises).then(() => { return this.awsClient;});
            }
            return this._awsClientPromise;
        }
    },

    _awsClient: {
        value: undefined
    },
    awsClient: {
        get: function () {
            return this._awsClient || (this._awsClient = this.instantiateAWSClientWithOptions(this.awsClientOptions));
        }
    },

    _awsClientOptions: {
        value: undefined
    },
    instantiateAWSClientOptions: {
        value: function() {
            var awsClientOptions = {
                apiVersion: this.apiVersion
            },
            connection = this.connection;

            if(connection) {

                if(connection.region) {
                    awsClientOptions.region = connection.region;
                } else if(connection.resourceArn) {
                    var region = connection.resourceArn.split(":")[3];
                    if(region) {
                        awsClientOptions.region = region;
                    }
                }

                // var region = connection.resourceArn.split(":")[3];
                // if(region) {
                //     awsClientOptions.region = region;
                // }

                if(this.credentials) {
                    awsClientOptions.credentials = this.credentials;
                }

                return awsClientOptions;

            } else {
                throw this.constructor.name +" Could not find a data service connection for stage - "+this.currentEnvironment.stage+" -";
            }

        }
    },
    awsClientOptions: {
        get: function () {
            return this._awsClientOptions || (this._awsClient = this.instantiateAWSClientOptions());
        }
    },

    _connection: {
        value: undefined
    },

    connection: {
        get: function() {
            if(!this._connection) {
                this.connection = this.connectionForIdentifier(this.currentEnvironment.stage);
            }
            return this._connection;
        },
        set: function(value) {

            if(value !== this._connection) {
                this._connection = value;
            }
        }
    },

    _credentials: {
        value: undefined
    },
    credentials: {
        get: function() {
            if(this._credentials === undefined) {

                if(!this.currentEnvironment.isAWS) {
                    var connection = this.connection,
                    credentials;

                    if(connection) {

                        credentials = fromIni({profile: connection.profile});

                        credentials = credentials().then((value) => {
                            console.log("credentials value:", value);
                            return value;
                        });
                    }
                    this._credentials = credentials;
                } else {
                    this._credentials = null;
                }
            }
            return this._credentials;
        }
    }


});
