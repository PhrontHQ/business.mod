var Object = require("./object").Object;

/**
 * @class ProductVariant
 * @extends Montage
 */



exports.ProductVariant = Object.specialize(/** @lends Product.prototype */ {

    title: {
        value: undefined
    },
    product: {
        value: undefined
    },
    images: {
        value: null
    },
    price: {
        value: undefined
    },
    selectedOptions: {
        value: undefined
    },
    availableForSale: {
        value: undefined
    },
    sku: {
        value: undefined
    },
    weight: {
        value: undefined
    },
    weightUnit: {
        value: undefined
    },
    presentmentPrices: {
        value: undefined
    }

});
