var Object = require("./object").Object;

/**
 * @class Calendar
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


exports.Calendar = Object.specialize(/** @lends Calendar.prototype */ {
    constructor: {
        value: function Calendar() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    kind: {
        value: undefined
    },
    etag: {
        value: undefined
    },
    summary: {
        value: undefined
    },
    description: {
        value: undefined
    },
    location: {
        value: undefined
    },
    conferenceProperties: {
        value: undefined
    },
    events: {
        value: undefined
    }
});
