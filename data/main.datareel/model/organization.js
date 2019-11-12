var Object = require("./object").Object;

/**
 * @class Organization
 * @extends Object
 */


exports.Organization = Object.specialize(/** @lends Organization.prototype */ {

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
    }

});