var MessagingChannel = require("./messaging-channel").MessagingChannel;

/**
 * @class EmailAddress
 * @extends MessagingChannel
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


exports.EmailAddress = MessagingChannel.specialize(/** @lends EmailAddress.prototype */ {
    constructor: {
        value: function EmailAddress() {
            this.super();
            //console.log("Phront MessagingChannel created");
            return this;
        }
    },

    email: {
        value: undefined
    },
    userName: {
        value: undefined
    },
    domain: {
        value: undefined
    }

});
