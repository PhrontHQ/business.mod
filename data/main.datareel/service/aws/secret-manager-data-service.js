var fromIni /* = (require) ("@aws-sdk/credential-provider-ini").fromIni */,
    // SecretsManager = (require) ("@aws-sdk/client-secrets-manager").SecretsManager,
    SecretsManagerClient /* = (require) ("@aws-sdk/client-secrets-manager/dist-cjs/SecretsManagerClient").SecretsManagerClient */,
    GetSecretValueCommand /* = (require) ("@aws-sdk/client-secrets-manager/dist-cjs/commands/GetSecretValueCommand").GetSecretValueCommand */,
    //DataService = (require) ("montage/data/service/data-service").DataService,
    AWSRawDataService = require("./a-w-s-raw-data-service").AWSRawDataService,
    SyntaxInOrderIterator = require("montage/core/frb/syntax-iterator").SyntaxInOrderIterator,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    currentEnvironment = require("montage/core/environment").currentEnvironment,
    //Causes issues
    // secretObjectDescriptor = (require) ("../model/aws/secret.mjson").montageObject,
    S3DataService;

    /*
        https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/index.html#usage
    */


/**
* TODO: Document
*
* @class
* @extends AWSRawDataService
*/
exports.SecretManagerDataService = SecretManagerDataService = AWSRawDataService.specialize(/** @lends SecretManagerDataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function SecretManagerDataService() {
            AWSRawDataService.call(this);

            //var mainService = DataService.mainService;
            //this.addEventListener(DataOperation.Type.ReadOperation,this,false);
            /*
                There's somethig fragile that needs to be solved here. If we listen on this, expecting that an event whose target is secretObjectDescriptorm, which we manage, is going to bubble to us. The problem is that it bubbles from Secret to DataObject first, but DataObject isn't handled by SecretManagerDataService, and so it bubbles through something else that manages directly DataObject. So that logic has to be adapted.

                There's also a dependency graph issue if we require secretObjectDescriptor directly, leaving it commmented above to remind of it.
            */
            //secretObjectDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);
            var self = this;
            this._childServiceTypes.addRangeChangeListener(function (plus, minus) {
                for(var i=0, countI = plus.length, iObjectDescriptor; (i < countI); i++) {
                    iObjectDescriptor = plus[i];
                    if(iObjectDescriptor.name === "Secret") {
                        iObjectDescriptor.addEventListener(DataOperation.Type.ReadOperation,self,false);
                    }
                }
            });

            return this;
        }
    },

    apiVersion: {
        value: "2017-10-17"
    },

    handleCreateTransactionOperation: {
        value: function (createTransactionOperation) {

            /*
                S3 doesn't have the notion of transaction, but we still need to find a way to make it work.
            */

        }
    },

    // _connection: {
    //     value: undefined
    // },

    // connection: {
    //     get: function() {
    //         if(!this._connection) {
    //             this.connection = this.connectionForIdentifier(this.currentEnvironment.stage);
    //         }
    //         return this._connection;
    //     },
    //     set: function(value) {

    //         if(value !== this._connection) {
    //             this._connection = value;
    //         }
    //     }
    // },

    // __SecretsManagerClient: {
    //     value: undefined
    // },

    // _SecretsManagerClient: {
    //     get: function () {
    //         if (!this.__SecretsManager) {
    //             var connection = this.connection;

    //             if(connection) {
    //                 var region,
    //                     credentials;

    //                 if(connection.region) {
    //                     region = connection.region;
    //                 } else if(connection.resourceArn) {
    //                     region = connection.resourceArn.split(":")[3];
    //                 }

    //                 var SecretsManagerOptions =  {
    //                     apiVersion: '2017-10-17',
    //                     region: region
    //                 };

    //                 if(!currentEnvironment.isAWS) {
    //                     credentials = fromIni({profile: connection.profile});
    //                 }

    //                 if(credentials) {
    //                     SecretsManagerOptions.credentials = credentials;
    //                 }

    //                 this.__SecretsManagerClient = new SecretsManagerClient(SecretsManagerOptions);

    //             } else {
    //                 throw "SecretsManager could not find a connection for stage - "+this.currentEnvironment.stage+" -";
    //             }

    //         }
    //         return this.__SecretsManagerClient;
    //     }
    // },

    instantiateAWSClientWithOptions: {
        value: function (awsClientOptions) {
            return new SecretsManagerClient(awsClientOptions);
        }
    },

    // __SecretsManagerPromise: {
    //     value: undefined
    // },

    // _SecretsManagerPromise: {
    //     get: function () {
    //         if (!this.__SecretsManagerPromise) {
    //             this.__SecretsManagerPromise = Promise.all([
    //                 require.async("@aws-sdk/credential-provider-ini"),
    //                 require.async("@aws-sdk/client-secrets-manager/dist-cjs/SecretsManagerClient"),
    //                 require.async("@aws-sdk/client-secrets-manager/dist-cjs/commands/GetSecretValueCommand")
    //             ])
    //             .then((resolvedModules) => {
    //                 fromIni = resolvedModules[0].fromIni;
    //                 SecretsManagerClient = resolvedModules[1].SecretsManagerClient;
    //                 GetSecretValueCommand = resolvedModules[2].GetSecretValueCommand;

    //                 return this._SecretsManagerClient;
    //             });
    //         }

    //         return this.__SecretsManagerPromise;
    //     }
    // },

    awsClientPromises: {
        get: function () {
            var promises = this.super();

            promises.push(
                require.async("@aws-sdk/client-secrets-manager/dist-cjs/SecretsManagerClient").then(function(exports) { SecretsManagerClient = exports.SecretsManagerClient})
            );
            promises.push(
                require.async("@aws-sdk/client-secrets-manager/dist-cjs/commands/GetSecretValueCommand").then(function(exports) { GetSecretValueCommand = exports.GetSecretValueCommand})
            );

            return promises;

        }
    },

    handleSecretReadOperation: {
        value: function (readOperation) {
            /*
                Until we solve more efficiently (lazily) how RawDataServices listen for and receive data operations, we have to check wether we're the one to deal with this:
            */
            if(!this.handlesType(readOperation.target)) {
                return;
            }

            //console.log("S3DataService - handleObjectReadOperation");

            var self = this,
                data = readOperation.data,
                objectDescriptor = readOperation.target,
                mapping = objectDescriptor && this.mappingForType(objectDescriptor),
                primaryKeyPropertyDescriptors = mapping && mapping.primaryKeyPropertyDescriptors,

                criteria = readOperation.criteria,
                parameters = criteria.parameters,
                // iterator = new SyntaxInOrderIterator(criteria.syntax, "property"),
                secretId = parameters && parameters.name,
                rawData,
                promises,
                operation;

            if(secretId) {
                /*
                    This params returns a data with these keys:
                    ["AcceptRanges","LastModified","ContentLength","ETag","ContentType","ServerSideEncryption","Metadata","Body"]
                */

                (promises || (promises = [])).push(new Promise(function(resolve, reject) {

                    self.awsClientPromise.then(() => {

                        const getSecretValueCommand = new GetSecretValueCommand({
                            SecretId: secretId
                        });
                        self.awsClient.send(getSecretValueCommand, function (err, data) {
                            if (err) {
                                /*

                                    if (err.code === 'DecryptionFailureException')
                                        // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
                                        // Deal with the exception here, and/or rethrow at your discretion.
                                        reject(err);
                                    else if (err.code === 'InternalServiceErrorException')
                                        // An error occurred on the server side.
                                        // Deal with the exception here, and/or rethrow at your discretion.
                                        reject(err);
                                    else if (err.code === 'InvalidParameterException')
                                        // You provided an invalid value for a parameter.
                                        // Deal with the exception here, and/or rethrow at your discretion.
                                        reject(err);
                                    else if (err.code === 'InvalidRequestException')
                                        // You provided a parameter value that is not valid for the current state of the resource.
                                        // Deal with the exception here, and/or rethrow at your discretion.
                                        reject(err);
                                    else if (err.code === 'ResourceNotFoundException')
                                        // We can't find the resource that you asked for.
                                        // Deal with the exception here, and/or rethrow at your discretion.
                                        reject(err);

                                */
                                console.log(err, err.stack); // an error occurred
                                (rawData || (rawData = {}))[data] = err;
                                reject(err);
                            }
                            else {
                                var secret, secretValue;
                                // Decrypts secret using the associated KMS CMK.
                                // Depending on whether the secret is a string or binary, one of these fields will be populated.
                                if ('SecretString' in data) {
                                    secret = data.SecretString;
                                    // console.log("secret:",secret);
                                } else {
                                    let buff = new Buffer(data.SecretBinary, 'base64');
                                    secret = decodedBinarySecret = buff.toString('ascii');
                                    //console.log("decodedBinarySecret:",decodedBinarySecret);
                                }

                                try {
                                    secretValue = JSON.parse(secret);
                                } catch(parseError) {
                                    //It's not jSON...
                                    secretValue = secret;
                                }
                                (rawData || (rawData = {}))["name"] = data.Name;
                                (rawData || (rawData = {}))["value"] = secretValue;

                                resolve(rawData);
                            }
                        });
                    });

                }));

            } else {
                console.log("Not sure what to send back, noOp?")
            }

            if(promises) {
                Promise.all(promises)
                .then(function(resolvedValue) {
                    operation = self.responseOperationForReadOperation(readOperation, null, [rawData], false/*isNotLast*/);
                    objectDescriptor.dispatchEvent(operation);
                }, function(error) {
                    operation = self.responseOperationForReadOperation(readOperation, error, null, false/*isNotLast*/);
                    objectDescriptor.dispatchEvent(operation);
                })
            } else {
                if(!rawData || (rawData && Object.keys(rawData).length === 0)) {
                    operation = new DataOperation();
                    operation.type = DataOperation.Type.NoOp;
                } else {
                    operation = self.responseOperationForReadOperation(readOperation, null /*no error*/, [rawData], false/*isNotLast*/);
                }
                objectDescriptor.dispatchEvent(operation);
            }
        }
    }


});
