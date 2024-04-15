var PartyMessagingChannel = require("./party-messaging-channel").PartyMessagingChannel;

/**
 *
 * @class PartyPhoneNumber
 * @extends PartyMessagingChannel
 *
 */


exports.PartyPhoneNumber = PartyMessagingChannel.specialize(/** @lends PartyPhoneNumber.prototype */ {
    constructor: {
        value: function PartyPhoneNumber() {
            this.super();
            //console.log("Phront PartyInstantMessageAddress created");
            return this;
        }
    }

});
