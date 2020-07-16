var Object = require("../object").Object;

/**
 * @class MessagingChannel
 * @extends Object
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


exports.MessagingChannel = Object.specialize(/** @lends MessagingChannel.prototype */ {
    constructor: {
        value: function MessagingChannel() {
            this.super();
            //console.log("Phront MessagingChannel created");
            return this;
        }
    },

    label: {
        value: undefined
    },
    preferredForParties: {
        value: undefined
    },
    description: {
        value: undefined
    },
    tags: {
        value: undefined
    }

});
