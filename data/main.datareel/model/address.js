var Object = require("./object").Object;

/**
 * @class Address
 * @extends Object
 */


exports.Address = Object.specialize(/** @lends Address.prototype */ {

    name: {
        value: undefined
    },
    firstName: {
        value: undefined
    },
    lastName: {
        value: undefined
    },
    phone: {
        value: undefined
    },
    company: {
        value: undefined
    },
    address1: {
        value: undefined
    },
    address2: {
        value: undefined
    },
    city: {
        value: undefined
    },
    provinceCode: {
        value: undefined
    },
    zip: {
        value: undefined
    },
    country: {
        value: undefined
    },
    latitude: {
        value: undefined
    },
    longitude: {
        value: undefined
    }
});
