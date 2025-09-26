var EventPerson = require("./event-person").EventPerson;

/**
 * @class EventAttendee
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends DataObject
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

    /*
    The attendee's response status. Possible values are:
        "needsAction" - The attendee has not responded to the invitation.
        "declined" - The attendee has declined the invitation.
        "tentative" - The attendee has tentatively accepted the invitation.
        "accepted" - The attendee has accepted the invitation.
    */
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
