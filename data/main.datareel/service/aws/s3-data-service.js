// const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand, S3 } = require("@aws-sdk/client-s3");


var S3Client,
    HeadObjectCommand,
    PutObjectCommand,
    GetObjectCommand,
    getSignedUrl,
    DataService = require("montage/data/service/data-service").DataService,
    AWSRawDataService = require("./a-w-s-raw-data-service").AWSRawDataService,
    //SyntaxInOrderIterator = (require) ("montage/core/frb/syntax-iterator").SyntaxInOrderIterator,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    crypto = require("crypto"),
    BucketDescriptor = require("../../model/aws/s3/bucket.mjson").montageObject,
    ObjectDescriptor = require("../../model/aws/s3/object.mjson").montageObject,
    ExpiringObjectDownloadDescriptor = require("../../model/aws/s3/expiring-object-download.mjson").montageObject,
    S3DataService;



/**
* TODO: Document
*
* @class
* @extends AWSRawDataService
*/
exports.S3DataService = S3DataService = AWSRawDataService.specialize(/** @lends S3DataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function S3DataService() {
            this.super();

            var mainService = DataService.mainService;
            // mainService.addEventListener(DataOperation.Type.ReadOperation,this,false);
            // mainService.addEventListener(DataOperation.Type.CreateOperation,this,false);

            /*
                #TODO #Fix There's a bug with event distribution path constructed for Object: following nextTarget, we end-up on DataObject, the super-class of Object, which is registered to PhrontDataService, and ends up being the nextTarget when we get into services rather than S3DataService which is the service handling Object.

                So we need to re-work nextTarget,
                    - either adding to it the ability to get the whole path at omce, which for the data layer would give us the ability to build what we need and cache it once and for all.
                    - or by improving nextTarget by turning it into a method carrying the path built so far su upper objects can be smarter about it? In our case looking at the target's service to continue in that layer the right way?

                In the mean time, listening directly for the type we handle should do it.

                And of course we need the equivalent of prepareForActivationEvent for DataServices to add themselves as listener lazily.

            */

            BucketDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);
            BucketDescriptor.addEventListener(DataOperation.Type.CreateOperation,this,false);

            ObjectDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);
            ObjectDescriptor.addEventListener(DataOperation.Type.CreateOperation,this,false);

            ExpiringObjectDownloadDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);
            ExpiringObjectDownloadDescriptor.addEventListener(DataOperation.Type.CreateOperation,this,false);


            return this;
        }
    },

    handleCreateTransactionOperation: {
        value: function (createTransactionOperation) {

            /*
                S3 doesn't have the notion of transaction, but we still need to find a way to make it work.
            */

        }
    },

    apiVersion: {
        value: "2006-03-01"
    },

    instantiateAWSClientWithOptions: {
        value: function (awsClientOptions) {
            return new S3Client(awsClientOptions);
        }
    },

    rawClientPromises: {
        get: function () {
            var promises = this.super();

            promises.push(
                require.async("@aws-sdk/client-s3/dist-cjs/S3Client").then(function(exports) { S3Client = exports.S3Client})
            );
            promises.push(
                require.async("@aws-sdk/client-s3/dist-cjs/commands/HeadObjectCommand").then(function(exports) { HeadObjectCommand = exports.HeadObjectCommand})
            );
            promises.push(
                require.async("@aws-sdk/client-s3/dist-cjs/commands/PutObjectCommand").then(function(exports) { PutObjectCommand = exports.PutObjectCommand})
            );
            promises.push(
                require.async("@aws-sdk/client-s3/dist-cjs/commands/GetObjectCommand").then(function(exports) { GetObjectCommand = exports.GetObjectCommand})
            );
            promises.push(
                require.async("@aws-sdk/s3-request-presigner").then(function(exports) { getSignedUrl = exports.getSignedUrl})
            );

            return promises;

        }
    },

    handleExpiringObjectDownloadReadOperation: {
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
                //We "know the pr
                readExpressions = readOperation.data.readExpressions,
                // iterator = new SyntaxInOrderIterator(criteria.syntax, "property"),
                Bucket = parameters && parameters.Bucket,
                Key = parameters && parameters.Key,
                rawData,
                promises,
                operation;

            if(Bucket && Key) {
                var params = {
                    Bucket: Bucket,
                    Key: Key
                   };

                /*
                    This params returns a data with these keys:
                    ["AcceptRanges","LastModified","ContentLength","ETag","ContentType","ServerSideEncryption","Metadata","Body"]
                */

                if (readExpressions) {
                    if(readExpressions.indexOf("signedUrl") !== -1) {
                        /*
                            Expires (Integer) — default: 900 — the number of seconds to expire the pre-signed URL operation in. Defaults to 15 minutes.
                        */

                        if(parameters.hasOwnProperty("expirationDelay")) {
                            var expirationDelay = Math.round(Number(parameters["expirationDelay"]));
                            if(Number.isNaN(expirationDelay)) {
                                console.error("Value for expirationDelay is not a number");
                            } else {
                                params["Expires"] = parameters["expirationDelay"]
                            }
                        }
                        (promises || (promises = [])).push(new Promise(function(resolve, reject) {

                            /*
                                For now, rawClientPromise gets all dependencies
                            */
                            self.rawClientPromise.then(() => {

                                const command = new GetObjectCommand(params);
                                getSignedUrl(self.rawClient, command, { expiresIn: 3600 })
                                .then((url) => {
                                    //console.log('signedURL is', url);
                                    (rawData || (rawData = {}))["signedUrl"] = url;

                                    resolve(url);
                                })
                                .catch((err) => {
                                    console.error(err, err.stack); // an error occurred
                                    (rawData || (rawData = {}))["signedUrl"] = err;
                                    reject(err);

                                });

                            });

                        }));
                    }

                    if((readExpressions.indexOf("key") !== -1) || (readExpressions.indexOf("bucketName") !== -1)) {
                        (rawData || (rawData = {}))["Bucket"] = Bucket;
                        (rawData || (rawData = {}))["Key"] = Key;
                    }

                }

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
    },

    handleObjectReadOperation: {
        value: function (readOperation) {
            /*
                Until we solve more efficiently (lazily) how RawDataServices listen for and receive data operations, we have to check wether we're the one to deal with this:
            */
            if(!this.handlesType(readOperation.target)) {
                return;
            }

            //console.log("S3DataService - handleObjectRead");

            var data = readOperation.data,
                objectDescriptor = readOperation.target,
                mapping = objectDescriptor && this.mappingForType(objectDescriptor),
                primaryKeyPropertyDescriptors = mapping && mapping.primaryKeyPropertyDescriptors,

                criteria = readOperation.criteria,
                //We "know the pr
                readExpressions = readOperation.data.readExpressions,
                // iterator = new SyntaxInOrderIterator(criteria.syntax, "property"),
                Bucket = criteria.parameters && criteria.parameters.Bucket,
                Key = criteria.parameters && criteria.parameters.Key,
                params = {
                    Bucket: Bucket,
                    Key: Key
                },
                rawData = params,
                error = null,
                self = this,
                operation;



            if(Bucket && Key) {

                function callback(err, data) {
                    if (err) {
                        console.error(err, err.stack); // an error occurred
                        error = err;
                        rawData = null;
                    }
                    else {
                        //console.log(data);           // successful response
                        error = null;
                        rawData = data;
                    }

                    operation = self.responseOperationForReadOperation(readOperation, error, [rawData], false/*isNotLast*/);
                    objectDescriptor.dispatchEvent(operation);
                }

                if (readExpressions) {

                        /*
                            This params returns a data with these keys:
                            ["AcceptRanges","LastModified","ContentLength","ETag","ContentType","ServerSideEncryption","Metadata","Body"]
                        */
                    if(readExpressions.indexOf("content") !== -1) {
                        /*
                            For now, rawClientPromise gets all dependencies
                        */
                        this.rawClientPromise.then(() => {
                            /*
                                aws-sdk v3
                                https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html

                                Command style
                            */
                            const getObjectCommand = new GetObjectCommand(params);
                            this.rawClient.send(getObjectCommand, callback);
                        });

                    } else if(params.hasOwnProperty("Key") && params.hasOwnProperty("Bucket") && Object.keys(params).length > 2) {

                        /*
                            For now, rawClientPromise gets all dependencies
                        */
                        this.rawClientPromise.then(() => {
                            /*
                                aws-sdk v3
                                https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/headobjectcommand.html
                                Command style
                            */
                            //No point to do even a head if nothing more is asked but Key and Bucket...
                            const headObjectCommand = new HeadObjectCommand(params);
                            this.rawClient.send(headObjectCommand, callback);
                        });


                    } else {
                        operation = this.responseOperationForReadOperation(readOperation, null, [params], false/*isNotLast*/);
                        objectDescriptor.dispatchEvent(operation);
                    }

                    /*
                        Expires (Integer) — default: 900 — the number of seconds to expire the pre-signed URL operation in. Defaults to 15 minutes.
                    */

                    // var signedURL1
                    // this.rawClient.getSignedUrl('getObject', params, function (err, url) {
                    //     if (err) {
                    //         console.error(err, err.stack); // an error occurred
                    //     }
                    //     else {
                    //         signedURL1 = url;
                    //         console.log('signedURL is', url);
                    //     }       // successful
                    // });

                } else {
                    /*
                        For now, rawClientPromise gets all dependencies
                    */
                    this.rawClientPromise.then(() => {

                        //If no expression, we return the default
                        /*
                            aws-sdk v3
                            https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/headobjectcommand.html
                            Command style
                        */

                        //No point to do even a head if nothing more is asked but Key and Bucket...
                        const headObjectCommand = new HeadObjectCommand(params);
                        this.rawClient.send(headObjectCommand, callback);
                    });

                }


            } else {
                console.log("Not sure what to send back, noOp?");
                operation = this.responseOperationForReadOperation(readOperation, new Error("No values for Primary Keys 'Bucket' and 'Key'"), null, false/*isNotLast*/);
                objectDescriptor.dispatchEvent(operation);
            }


            // while ((currentSyntax = iterator.next("and").value)) {

        }
    },

    handleObjectCreateOperation: {
        value: function (createOperation) {

            if(!this.handlesType(createOperation.target)) {
                return;
            }

            var self = this,
                params = createOperation.data;
            if((!params.hasOwnProperty("Bucket")) && (this.connection.bucketName)) {
                params["Bucket"] = this.connection.bucketName;
            }

            if(!params.hasOwnProperty("ContentMD5")) {
                var body = params.Body,
                    contentMD5 = crypto.createHash("md5").update(body).digest("base64");

                params["ContentMD5"] = contentMD5;
            }

            /*
                For now, rawClientPromise gets all dependencies
            */
            this.rawClientPromise.then(() => {

                const command = new PutObjectCommand(params);
                var operation = new DataOperation();
                operation.referrerId = createOperation.id;
                operation.clientId = createOperation.clientId;

                operation.target = createOperation.target;

                this.rawClient.send(command)
                .then(function(data) {
                    /*
                        data is like:
                        data = {
                        ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"",
                        VersionId: "Bvq0EDKxOcXLJXNo_Lkz37eM3R4pfzyQ"
                        }
                    */
                    // console.log(data);           // successful response
                    operation.type = DataOperation.Type.CreateCompletedOperation;
                    var bucketName = params["Bucket"],
                        bucketRegion = self.connection.bucketRegion,
                        key = params["Key"];

                    operation.data = {
                        Bucket: bucketName,
                        Key: key,
                        ETag: data.ETag,
                        Location: `https://${bucketName}.s3.amazonaws.com/${key}`
                    };

                })
                .catch(function(err) {
                    console.error(err, err.stack); // an error occurred
                    operation.type = DataOperation.Type.CreateFailedOperation;
                    operation.data = err;
                })
                .finally(function() {
                    operation.target.dispatchEvent(operation);
                });

            });

            // this.rawClient.putObject(params, function (err, data) {

            //     var operation = new DataOperation();
            //     operation.referrerId = createOperation.id;
            //     operation.clientId = createOperation.clientId;

            //     operation.target = createOperation.target;

            //     if (err) {
            //         console.error(err, err.stack); // an error occurred
            //         operation.type = DataOperation.Type.CreateFailedOperation;
            //         operation.data = err;
            //     }
            //     else {
            //         /*
            //             data is like:
            //             data = {
            //             ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"",
            //             VersionId: "Bvq0EDKxOcXLJXNo_Lkz37eM3R4pfzyQ"
            //             }
            //         */
            //         // console.log(data);           // successful response
            //         operation.type = DataOperation.Type.CreateCompletedOperation;
            //         var bucketName = params["Bucket"],
            //             bucketRegion = self.connection.bucketRegion,
            //             key = params["Key"];

            //         operation.data = {
            //             Bucket: bucketName,
            //             Key: key,
            //             ETag: data.ETag,
            //             Location: `https://${bucketName}.s3-${bucketRegion}.amazonaws.com/${key}`
            //         };

            //     }

            //     operation.target.dispatchEvent(operation);

            // });

        }
    },

    handleBucketReadOperation: {
        value: function (readOperation) {
            /*
                Until we solve more efficiently (lazily) how RawDataServices listen for and receive data operations, we have to check wether we're the one to deal with this:
            */
            if(!this.handlesType(readOperation.target)) {
                return;
            }

            //console.log("S3DataService - handleObjectRead");

            var data = readOperation.data,
                objectDescriptor = readOperation.target,
                mapping = objectDescriptor && this.mappingForType(objectDescriptor),
                primaryKeyPropertyDescriptors = mapping && mapping.primaryKeyPropertyDescriptors,

                criteria = readOperation.criteria,
                //We "know the pr
                readExpressions = readOperation.data.readExpressions,
                // iterator = new SyntaxInOrderIterator(criteria.syntax, "property"),
                Bucket = criteria.parameters && criteria.parameters.Bucket,
                params,
                operation;


            /*
                to handle a criteria's expression like 'Bucket == $'
            */
            if(!Bucket) {
                var qualifiedProperties = criteria.qualifiedProperties;
                if(qualifiedProperties.length === 1 && qualifiedProperties[0] === "Bucket") {
                    Bucket = criteria.parameters;
                }
            }

            if(Bucket) {

                params = {
                    Bucket: Bucket
                };

                if (readExpressions) {
                        /*
                            This params returns a data with these keys:
                            ["AcceptRanges","LastModified","ContentLength","ETag","ContentType","ServerSideEncryption","Metadata","Body"]
                        */

                    /*
                        Expires (Integer) — default: 900 — the number of seconds to expire the pre-signed URL operation in. Defaults to 15 minutes.
                    */

                }

                operation = this.responseOperationForReadOperation(readOperation, null, [params], false/*isNotLast*/);

            } else {
                console.log("Not sure what to send back, noOp?");
                operation = this.responseOperationForReadOperation(readOperation, new Error("No values for Primary Keys 'Bucket' and 'Key'"), null, false/*isNotLast*/);
            }

            objectDescriptor.dispatchEvent(operation);

            // while ((currentSyntax = iterator.next("and").value)) {

        }
    },

    handleReadOperation: {
        value: function (readOperation) {

            /*
                Until we solve more efficiently (lazily) how RawDataServices listen for and receive data operations, we have to check wether we're the one to deal with this:
            */
           if(!this.handlesType(readOperation.target)) {
            return;
            }

            // console.log("S3DataService - handleRead");

            var data = readOperation.data,
                objectDescriptor = readOperation.target,
                readExpressions = readOperation.data.readExpressions;

            if (readExpressions) {


            }
        }
    }


    /*
        listBuckets(params = {}, callback) ⇒ AWS.Request
        https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listBuckets-property
    */

    /*
        listObjectsV2(params = {}, callback) ⇒ AWS.Request
        https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectsV2-property


        listObjectVersions(params = {}, callback) ⇒ AWS.Request
        https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectVersions-property
    */

    /*
        listMultipartUploads(params = {}, callback) ⇒ AWS.Request
        https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listMultipartUploads-property


        UploadPart type, MultipartUpload has a toMany to UploadPart
        listParts(params = {}, callback) ⇒ AWS.Request
        https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listParts-property
    */


});
