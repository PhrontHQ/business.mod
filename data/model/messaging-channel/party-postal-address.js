const PartyPostalAddress = require("mod/data/model/messaging-channel/party-postal-address").PartyPostalAddress,
    Montage = require("mod/core/core").Montage;

/**
 * @class Organization
 * @extends Party
 */


exports.PartyPostalAddress = PartyPostalAddress;

Montage.defineProperties(PartyPostalAddress.prototype, {
    employmentPositions: {
        value: undefined
    },
    b2cCustomerRelationships: {
        value: undefined
    },
    b2bCustomerRelationships: {
        value: undefined
    },
    supplierRelationships: {
        value: undefined
    },
    services: {
        value: undefined
    },
    customerEngagementQuestionnaires: {
        value: undefined
    }
});
