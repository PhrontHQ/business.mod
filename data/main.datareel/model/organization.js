var Party = require("./party").Party;

/**
 * @class Organization
 * @extends Object
 */


exports.Organization = Party.specialize(/** @lends Organization.prototype */ {
    constructor: {
        value: function Organization() {
            this.super();
            return this;
        }
    },
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
    b2cCustomerRelationships: {
        value: undefined
    },
    b2bCustomerRelationships: {
        value: undefined
    },
    supplierRelationships: {
        value: undefined
    }

});
