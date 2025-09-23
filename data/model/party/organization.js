const Organization = require("mod/data/model/party/organization").Organization,
    Montage = require("mod/core/core").Montage;

/**
 * @class Organization
 * @extends Party
 */


exports.Organization = Organization;

Montage.defineProperties(Organization.prototype, {
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
