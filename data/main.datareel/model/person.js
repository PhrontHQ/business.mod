var Object = require("./object").Object;
/**
 * @class Person
 * @extends Object
 */


exports.Person = Object.specialize(/** @lends Person.prototype */ {

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
    }

});