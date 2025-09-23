var Montage = require("mod/core/core").Montage;

/**
 * @class ProductVariantPricePair
 * @extends Montage
 */



exports.ProductVariantPricePair = Montage.specialize(/** @lends Product.prototype */ {

    compareAtPrice: {
        value: undefined
    },
    price: {
        value: undefined
    }
});
