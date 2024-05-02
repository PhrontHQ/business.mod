var DataObject = require("mod/data/model/data-object").DataObject;
/**
 * @class Party
 * @extends DataObject
 */


exports.Party = DataObject.specialize(/** @lends Party.prototype */ {

    existenceTimeRange: {
        value: undefined
    },
    postalAddresses: {
        value: undefined
    },
    emailAddresses: {
        value: undefined
    },
    phoneNumbers: {
        value: undefined
    },
    instantMessageAddresses: {
        value: undefined
    },
    urlAddresses: {
        value: undefined
    },
    contactForms: {
        value: undefined
    },
    socialProfiles: {
        value: undefined
    },
    calendars: {
        value: undefined
    },
    images: {
        value: undefined
    }

});
