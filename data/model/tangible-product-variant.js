var ProductVariant = require("./product-variant").ProductVariant;

/**
 * @class TangibleProductVariant
 * @extends Montage
 */



exports.TangibleProductVariant = ProductVariant.specialize(/** @lends TangibleProductVariant.prototype */ {

    weight: {
        value: undefined
    },
    weightUnit: {
        value: undefined
    }
});
