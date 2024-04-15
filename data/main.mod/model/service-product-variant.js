var ProductVariant = require("./product-variant").ProductVariant;

/**
 * @class ServiceProductVariant
 * @extends Montage
 */

 /*
    Pointers:

    https://support.versum.com/support/solutions/articles/24000043312-how-to-add-prep-time-and-recovery-time-to-a-service

    https://support.versum.com/support/solutions/articles/24000043312-how-to-add-prep-time-and-recovery-time-to-a-service

    https://support.versum.com/support/solutions/folders/6000042941

 */



exports.ServiceProductVariant = ProductVariant.specialize(/** @lends ServiceProductVariant.prototype */ {

    professionalName: {
        value: undefined
    },
    professionalShortName: {
        value: undefined
    },
    isEmergencyService: {
        value: undefined
    },
    preparationDuration: {
        value: undefined
    },
    duration: {
        value: undefined
    },
    gapTimeRange: {
        value: undefined
    },
    recoveryDuration: {
        value: undefined
    },
    requiredResources: {
        value: undefined
    },
    providers: {
        value: undefined
    },
    serviceEngagements: {
        value: undefined
    }

    /* returns in seconds */
    // duration: {
    //     get: function() {
    //         var selectedOptions = this.selectedOptions;

    //         if(selectedOptions) {
    //             var i, countI, iSelectedOption;

    //             for(i=0, countI = selectedOptions.length; (i < countI); i++) {
    //                 iSelectedOption = selectedOptions[i];
    //                 if( iSelectedOption.name === "Durée" /* to supports legacy import from shopify*/) {
    //                     return Number(iSelectedOption.value)/* in minutes */*60;/* to make seconds*/

    //                 } else if(iSelectedOption.name === "duration" ) {
    //                     return Number(iSelectedOption.value)/* already in seconds*/
    //                 }
    //             }
    //         }
    //     }
    // }

});
