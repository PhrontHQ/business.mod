var Object = require("./object").Object;
/**
 * @class Party
 * @extends Object
 */


exports.Party = Object.specialize(/** @lends Party.prototype */ {

    existenceTimeRange: {
        value: undefined
    },
    contactInformation: {
        value: undefined
    },
    calendars: {
        value: undefined
    }

});
