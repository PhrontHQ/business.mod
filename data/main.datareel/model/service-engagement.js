var DataObject = require("./data-object").DataObject;
/**
 * @class ServiceEngagement
 * @extends DataObject
 */


exports.ServiceEngagement = DataObject.specialize(/** @lends ServiceEngagement.prototype */ {
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
