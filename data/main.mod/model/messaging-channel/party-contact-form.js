var PartyMessagingChannel = require("./party-messaging-channel").PartyMessagingChannel;

/**
 *
 * @class PartyContactForm
 * @extends PartyMessagingChannel
 *
 */


exports.PartyContactForm = PartyMessagingChannel.specialize(/** @lends PartyContactForm.prototype */ {
    constructor: {
        value: function PartyContactForm() {
            this.super();
            //console.log("Phront MessagingChannel created");
            return this;
        }
    }

});
