var PartyPartyRelationship = require("./party-party-relationship").PartyPartyRelationship;
/**
 * @class EmploymentPositionStaffing
 * @extends PartyPartyRelationship
 */


exports.EmploymentPositionStaffing = PartyPartyRelationship.specialize(/** @lends EmploymentPositionStaffing.prototype */ {

    employmentType: {
        value: undefined
    },
    employmentPosition: {
        value: undefined
    },
    employee: {
        value: undefined
    }

});
