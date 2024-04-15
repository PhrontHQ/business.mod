var Target = require("montage/core/target").Target;

/**
 * @class ConferenceEntryPoint
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends DataObject
 */


exports.ConferenceEntryPoint = Target.specialize(/** @lends EventPerson.prototype */ {
    constructor: {
        value: function ConferenceEntryPoint() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    entryPointType: {
        value: undefined
    },
    uri: {
        value: undefined
    },
    label: {
        value: undefined
    },
    pin: {
        value: undefined
    },
    accessCode: {
        value: undefined
    },
    meetingCode: {
        value: undefined
    },
    passcode: {
        value: undefined
    },
    password: {
        value: undefined
    }
});
