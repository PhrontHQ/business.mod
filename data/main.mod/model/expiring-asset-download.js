/**
    @module business-data.mod/data/main.mod/model/aws/s3/object
*/

var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class ExpiringAssetDownload
 * @extends DataObject
 *
 */



exports.ExpiringAssetDownload = DataObject.specialize(/** @lends ExpiringAssetDownload.prototype */ {
    asset: {
        value: undefined
    },
    expirationDelay: {
        value: undefined
    },
    signedUrl: {
        value: undefined
    }
});
