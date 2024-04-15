/**
    @module phront/data/main.mod/model/aws/s3/multipart-upload
*/


var Object = require("../../../object").Object;

/**
 * @class MultipartUpload
 * @extends DataObject
 *
 * listMultipartUploads(params = {}, callback) ⇒ AWS.Request
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listMultipartUploads-property
 *
 */

exports.MultipartUpload = DataObject.specialize(/** @lends MultipartUpload.prototype */ {

    identifier: {
        value: undefined
    }
});
