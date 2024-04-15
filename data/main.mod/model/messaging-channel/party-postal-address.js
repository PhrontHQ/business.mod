var PartyMessagingChannel = require("./party-messaging-channel").PartyMessagingChannel;

/**
 *
 * @class PartyPhoneNumber
 * @extends PartyMessagingChannel
 *
 */


exports.PartyPostalAddress = PartyMessagingChannel.specialize(/** @lends PartyPostalAddress.prototype */ {
    constructor: {
        value: function PartyPostalAddress() {
            this.super();
            //console.log("Phront PartyPostalAddress created");
            return this;
        }
    }

});
