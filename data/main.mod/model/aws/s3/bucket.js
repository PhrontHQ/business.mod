/**
    @module business-data.mod/data/main.mod/model/aws/s3/bucket
*/

var DataObject = require("../../data-object").DataObject;

/**
 * @class Bucket
 * @extends DataObject
 *
 */

exports.Bucket = DataObject.specialize(/** @lends Bucket.prototype */ {

    identifier: {
        value: undefined
    }
});
