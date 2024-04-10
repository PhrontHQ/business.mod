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
            this.super();
            return this;
        }
    },

    apiVersion: {
        value: undefined
    },

    _rawClientPromises: {
        value: undefined
    },

    rawClientPromises: {
        get: function () {

            if (!this._rawClientPromises) {
                var promises = this.super();

                if(!this.currentEnvironment.isAWS) {
                    promises.push(
                        require.async("@aws-sdk/credential-provider-ini").then(function(exports) { fromIni = exports.fromIni})
                    )
                };

            }
            return this._rawClientPromises;
        }
    },

    _rawClientPromise: {
        value: undefined
    },

    rawClientPromise: {
        get: function () {
            if (!this._rawClientPromise) {
                var rawClientPromise = this.super();
                this._rawClientPromise = rawClientPromise.then(() => { return this.rawClient;});
            }
            return this._rawClientPromise;
        }
    },

    _rawClient: {
        value: undefined
    },
    rawClient: {
        get: function () {
            return this._rawClient || (this._rawClient = this.instantiateAWSClientWithOptions(this.awsClientOptions));
        }
    },

    _rawClientOptions: {
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
            return this._rawClientOptions || (this._rawClient = this.instantiateAWSClientOptions());
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
