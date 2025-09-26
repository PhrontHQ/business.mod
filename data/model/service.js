var Product = require("./product").Product;

/**
 * @class Service
 * @extends Product
 */

/*

requiredResources: This can be anything from person to tools, to consumable materials. It is an open relatiionship. Could be modeled as a hstore key is uuid, value the tableName?

*/

exports.Service = Product.specialize(/** @lends Product.prototype */ {

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

});
