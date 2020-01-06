var Party = require("./party").Party;
/**
 * @class Person
 * @extends Object
 */


exports.Person = Party.specialize(/** @lends Person.prototype */ {

    firstName: {
        value: undefined
    },
    lastName: {
        value: undefined
    },
    email: {
        value: undefined
    },
    phone: {
        value: undefined
    },
    image: {
        value: undefined
    },
    addresses: {
        value: undefined
    },
    orders: {
        value: undefined
    },
    tags: {
        value: undefined
    },
    userIdentities: {
        value: undefined
    },
    employerRelationships: {
        value: undefined
    }

});