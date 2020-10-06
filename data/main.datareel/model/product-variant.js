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
    },
    /* returns in seconds */
    duration: {
        get: function() {
            var selectedOptions = this.selectedOptions;

            if(selectedOptions) {
                var i, countI, iSelectedOption;

                for(i=0, countI = selectedOptions.length; (i < countI); i++) {
                    iSelectedOption = selectedOptions[i];
                    if( iSelectedOption.name === "Durée" /* to supports legacy import from shopify*/) {
                        return Number(iSelectedOption.value)/* in minutes */*60;/* to make seconds*/

                    } else if(iSelectedOption.name === "duration" ) {
                        return Number(iSelectedOption.value)/* already in seconds*/
                    }
                }
            }
        }
    }

});
