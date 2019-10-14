var Montage = require("montage").Montage;

/**
 * @class ProductVariant
 * @extends Montage
 */



exports.ProductVariant = Montage.specialize(/** @lends Product.prototype */ {

    title: {
        value: undefined
    },
    product: {
        value: undefined
    },
    image: {
        value: null
    },
    price: {
        value: undefined
    },
    requiresShipping: {
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