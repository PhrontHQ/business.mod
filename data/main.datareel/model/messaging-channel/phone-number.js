var MessagingChannel = require("./messaging-channel").MessagingChannel;


/**
 * @class PhoneNumber
 * @extends Object
 * @classdesc Represents a PhoneNumber, in any country.
 *
 * Using https://github.com/paypal/fullstack-phone
 * https://www.npmjs.com/package/fullstack-phone
 *
 * for the actual phone number, which parts are stored inline but gathered as one type here that
 * will be leveraged from that library
 *
 */


exports.PhoneNumber = MessagingChannel.specialize(/** @lends PhoneNumber.prototype */ {
    constructor: {
        value: function PhoneNumber() {
            this.super();
            //console.log("Phront MessagingChannel created");
            return this;
        }
    },

    countryCode: {
        value: undefined
    },
    nationalNumber: {
        value: undefined
    },
    extension: {
        value: undefined
    }

});
