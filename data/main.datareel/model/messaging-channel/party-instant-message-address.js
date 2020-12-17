var PartyMessagingChannel = require("./party-messaging-channel").PartyMessagingChannel;

/**
 *
 * @class PartyInstantMessageAddress
 * @extends PartyMessagingChannel
 *
 */


exports.PartyInstantMessageAddress = PartyMessagingChannel.specialize(/** @lends PartyInstantMessageAddress.prototype */ {
    constructor: {
        value: function PartyInstantMessageAddress() {
            this.super();
            //console.log("Phront PartyInstantMessageAddress created");
            return this;
        }
    }

});
