/**
    @module business-data.mod/data/main.mod/model/aws/secret
*/

var DataObject = require("../data-object").DataObject;

/**
 * @class Secret
 * @extends DataObject
 *
 */

exports.Secret = DataObject.specialize(/** @lends Secret.prototype */ {

    name: {
        value: undefined
    },
    value: {
        value: undefined
    }
});
