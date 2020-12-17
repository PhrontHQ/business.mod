var AWS = require('aws-sdk'),
    S3 =  AWS.S3,
    DataService = require("montage/data/service/data-service").DataService,
    RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    S3DataService;



/**
* TODO: Document
*
* @class
* @extends RawDataService
*/
exports.S3DataService = S3DataService = RawDataService.specialize(/** @lends S3DataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function S3DataService() {
            RawDataService.call(this);

            return this;
        }
    },

    handleCreateTransaction: {
        value: function (createTransactionOperation) {

            /*
                S3 doesn't have the notion of transaction, but we still need to find a way to make it work.
            */

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
