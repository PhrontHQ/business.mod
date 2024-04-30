var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class SocialProfile
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


exports.SocialProfile = DataObject.specialize(/** @lends SocialProfile.prototype */ {
    constructor: {
        value: function SocialProfile() {
            this.super();
            //console.log("Phront MessagingChannel created");
            return this;
        }
    },

    serviceName: {
        value: undefined
    },
    userName: {
        value: undefined
    },
    provider: {
        value: undefined
    }

});
