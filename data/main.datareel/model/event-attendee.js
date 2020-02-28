var EventPerson = require("./event-person").EventPerson;

/**
 * @class EventAttendee
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


exports.EventAttendee = EventPerson.specialize(/** @lends EventAttendee.prototype */ {
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
    isOrganizer: {
        value: undefined
    },
    self: {
        value: undefined
    },
    isResource: {
        value: undefined
    },
    isOptional: {
        value: undefined
    },
    responseStatus: {
        value: undefined
    },
    comment: {
        value: undefined
    },
    additionalGuestCount: {
        value: undefined
    }
});
