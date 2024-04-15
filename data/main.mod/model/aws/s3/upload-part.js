var Object = require("../../../object").Object;

/**
 * @class UploadPart
 * @extends DataObject
 *
 * UploadPart type, MultipartUpload has a toMany to UploadPart
 * listParts(params = {}, callback) ⇒ AWS.Request
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listParts-property
 *
 */

exports.UploadPart = DataObject.specialize(/** @lends UploadPart.prototype */ {

    identifier: {
        value: undefined
    }
});
