var Party = require("./party").Party;

/**
 * @class Organization
 * @extends Object
 */


exports.Organization = Party.specialize(/** @lends Organization.prototype */ {

    name: {
        value: undefined
    },
    type: {
        value: undefined
    },
    email: {
        value: undefined
    },
    phone: {
        value: undefined
    },
    addresses: {
        value: undefined
    },
    parent: {
        value: undefined
    },
    suborganizations: {
        value: undefined
    },
    tags: {
        value: undefined
    },
    mainContact: {
        value: undefined
    },
    employeeRelationships: {
        value: undefined
    },
    customerRelationships: {
        value: undefined
    },
    supplierRelationships: {
        value: undefined
    }

});