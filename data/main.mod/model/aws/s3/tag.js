/**
    @module business-data.mod/data/main.mod/model/aws/secret
*/

var DataObject = require("../../data-object").DataObject;

/**
 * @class Tag
 * @extends DataObject
 *
 */

exports.Tag = DataObject.specialize(/** @lends Secret.prototype */ {

    key: {
        value: undefined
    },
    value: {
        value: undefined
    }
});
