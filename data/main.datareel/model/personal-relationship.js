var PartyPartyRelationship = require("./party-party-relationship").PartyPartyRelationship;
/**
 * @class PersonalRelationship
 * @extends PartyPartyRelationship
 */


exports.PersonalRelationship = PartyPartyRelationship.specialize(/** @lends PersonalRelationship.prototype */ {

    firstPerson: {
        value: undefined
    },
    firstPersonRelationshipRole: {
        value: undefined
    },
    secondPerson: {
        value: undefined
    },
    secondPersonRelationshipRole: {
        value: undefined
    }

});
