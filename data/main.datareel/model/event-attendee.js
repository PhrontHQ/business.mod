var Target = require("montage/core/target").Target;

/**
 * @class EventAttendee
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


exports.EventAttendee = Target.specialize(/** @lends EventAttendee.prototype */ {
    constructor: {
        value: function EventAttendee() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    id: {
        value: undefined
    },
    email: {
        value: undefined
    },
    displayName: {
        value: undefined
    },
    organizer: {
        value: undefined
    },
    self: {
        value: undefined
    },
    resource: {
        value: undefined
    },
    optional: {
        value: undefined
    },
    responseStatus: {
        value: undefined
    },
    comment: {
        value: undefined
    },
    additionalGuests: {
        value: undefined
    }
});
