var PartyMessagingChannel = require("./party-messaging-channel").PartyMessagingChannel;

/**
 *
 * @class PartyEmailAddress
 * @extends PartyMessagingChannel
 *
 */


exports.PartyEmailAddress = PartyMessagingChannel.specialize(/** @lends PartyEmailAddress.prototype */ {
    constructor: {
        value: function PartyEmailAddress() {
            this.super();
            //console.log("Phront PartyEmailAddress created");
            return this;
        }
    }

});
