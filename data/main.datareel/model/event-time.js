var Target = require("montage/core/target").Target;

/**
 * @class EventTime
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


exports.EventTime = Target.specialize(/** @lends EventPerson.prototype */ {
    constructor: {
        value: function EventTime() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    date: {
        value: undefined
    },
    dateTime: {
        value: undefined
    },
    timeZone: {
        value: undefined
    },
});
