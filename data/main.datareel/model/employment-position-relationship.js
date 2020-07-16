var PartyPartyRelationship = require("./party-party-relationship").PartyPartyRelationship;
/**
 * @class EmploymentPosition
 * @extends PartyPartyRelationship
 */


exports.EmploymentPositionRelationship = PartyPartyRelationship.specialize(/** @lends EmploymentPosition.prototype */ {

    firstEmploymentPosition: {
        value: undefined
    },
    firstEmploymentPositionRole: {
        value: undefined
    },
    secondEmploymentPosition: {
        value: undefined
    },
    secondEmploymentPositionRole: {
        value: undefined
    }

});
