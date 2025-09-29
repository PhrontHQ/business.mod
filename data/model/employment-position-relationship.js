var PartyPartyRelationship = require("./party-party-relationship").PartyPartyRelationship;
/**
 * @class EmploymentPosition
 * @extends PartyPartyRelationship
 */


exports.EmploymentPositionRelationship = PartyPartyRelationship.specialize(/** @lends EmploymentPosition.prototype */ {

    firstEmploymentPosition: {
        value: undefined
    },
    firstEmploymentPositionRelationshipRole: {
        value: undefined
    },
    secondEmploymentPosition: {
        value: undefined
    },
    secondEmploymentPositionRelationshipole: {
        value: undefined
    }

});
