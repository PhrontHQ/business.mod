var Montage = require("montage").Montage;

/**
 * @class Address
 * @extends Montage
 */


exports.Address = Montage.specialize(/** @lends Address.prototype */ {

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