var PartyMessagingChannel = require("./party-messaging-channel").PartyMessagingChannel;

/**
 *
 * @class PartySMSNumber
 * @extends PartyMessagingChannel
 *
 */


exports.PartySMSNumber = PartyMessagingChannel.specialize(/** @lends PartySMSNumber.prototype */ {
    constructor: {
        value: function PartySMSNumber() {
            this.super();
            //console.log("Phront PartyInstantMessageAddress created");
            return this;
        }
    }

});
