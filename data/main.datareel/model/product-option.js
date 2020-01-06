var Object = require("./object").Object;

/**
 * @class ProductOption
 * @extends Object
 */



exports.ProductOption = Object.specialize(/** @lends ProductOption.prototype */ {

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