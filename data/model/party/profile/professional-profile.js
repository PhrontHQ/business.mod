var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class ProfessionalProfile
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


exports.ProfessionalProfile = DataObject.specialize(/** @lends ProfessionalProfile.prototype */ {
    constructor: {
        value: function ProfessionalProfile() {
            this.super();
            //console.log("Phront MessagingChannel created");
            return this;
        }
    },

    owner: {
        value: undefined
    },
    url: {
        value: undefined
    },
    hostingOrganization: {
        value: undefined
    }

});
