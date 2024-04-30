var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class ProductVariant
 * @extends Montage
 */



exports.ProductVariant = DataObject.specialize(/** @lends Product.prototype */ {

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
    presentmentPrices: {
        value: undefined
    }

});
