var PartyPartyRelationship = require("./party-party-relationship").PartyPartyRelationship;
/**
 * @class EmploymentPosition
 * @extends PartyPartyRelationship
 */


exports.EmploymentPosition = PartyPartyRelationship.specialize(/** @lends EmploymentPosition.prototype */ {

    allowedEmploymentTypes: {
        value: undefined
    },
    employer: {
        value: undefined
    },
    position: {
        value: undefined
    }

});
