var Object = require("./object").Object;
/**
 * @class ServiceEngagement
 * @extends Object
 */


exports.ServiceEngagement = Object.specialize(/** @lends ServiceEngagement.prototype */ {
    service: {
        value: undefined
    },

    serviceVariant: {
        value: undefined
    },

    event: {
        value: undefined
    }

});
