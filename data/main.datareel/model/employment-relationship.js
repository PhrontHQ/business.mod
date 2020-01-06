var PartyPartyRelationship = require("./party-party-relationship").PartyPartyRelationship;
/**
 * @class EmploymentRelationship
 * @extends PartyPartyRelationship
 */


exports.EmploymentRelationship = PartyPartyRelationship.specialize(/** @lends EmploymentRelationship.prototype */ {

    employmentType: {
        value: undefined
    },
    employer: {
        value: undefined
    },
    employee: {
        value: undefined
    }

});