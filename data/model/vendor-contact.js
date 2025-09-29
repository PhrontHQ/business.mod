var Montage = require("mod/core/core").Montage;

/**
 * @class VendorContact
 * @extends Montage
 */



exports.VendorContact = Montage.specialize(/** @lends VendorContact.prototype */ {

    name: {
        value: undefined
    },
    vendors: {
        value: undefined
    },
    photos: {
        value: undefined
    },
    phoneNumber: {
        value: undefined
    },
    email: {
        value: undefined
    }

});
