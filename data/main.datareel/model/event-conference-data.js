var Target = require("montage/core/target").Target;

/**
 * @class EventPerson
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


exports.EventConferenceData = Target.specialize(/** @lends EventPerson.prototype */ {
    constructor: {
        value: function EventConferenceData() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    createRequest: {
        value: undefined
    },
    entryPoints: {
        value: undefined
    },
    conferenceSolution: {
        value: undefined
    },
    conferenceSolution: {
        value: undefined
    },
    conferenceId: {
        value: undefined
    },
    signature: {
        value: undefined
    },
    notes: {
        value: undefined
    },
    gadget: {
        value: undefined
    }
});
