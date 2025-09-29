var DataObject = require("mod/data/model/data-object").DataObject;
/**
 * @class DataObjectType
 * @extends DataObject
 */


exports.DataObjectType = DataObject.specialize(/** @lends DataObjectType.prototype */ {

    name: {
        value: undefined
    },
    parent: {
        value: undefined
    },
    subtypes: {
        value: undefined
    }

});
