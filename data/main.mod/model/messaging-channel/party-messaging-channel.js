var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class PartyMessagingChannel
 * @extends DataObject
 *
 * A way to reach someone:
 *  - a postal address,
 * - a phone number / SMS
 * - an email,
 * - an instant message (skype...)
 * - a social profile (public twitter @account or private DM)
 * - a push notification (through Apple and Google push notifications, tied to a user identity)
 * - an in-app messaging, either when user is in-App or async via service-worker.
 *
 */


exports.PartyMessagingChannel = DataObject.specialize(/** @lends PartyMessagingChannel.prototype */ {
    constructor: {
        value: function PartyMessagingChannel() {
            this.super();
            //console.log("Phront PartyMessagingChannel created");
            return this;
        }
    },

    party: {
        value: undefined
    },
    label: {
        value: undefined
    },
    messagingChannel: {
        value: undefined
    },
    description: {
        value: undefined
    }

});
