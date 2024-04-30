var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class ProductOption
 * @extends DataObject
 */



exports.ProductOption = DataObject.specialize(/** @lends ProductOption.prototype */ {

    name: {
        value: undefined
    },
    position: {
        value: undefined
    },
    values: {
        value: null
    }

});
