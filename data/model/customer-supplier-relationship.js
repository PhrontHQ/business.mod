var PartyPartyRelationship = require("./party-party-relationship").PartyPartyRelationship;
/**
 * @class CustomerSupplierRelationship
 * @extends PartyPartyRelationship
 */


exports.CustomerSupplierRelationship = PartyPartyRelationship.specialize(/** @lends CustomerSupplierRelationship.prototype */ {

    customer: {
        value: undefined
    },
    supplier: {
        value: undefined
    },
    orders: {
        value: undefined
    }

});
