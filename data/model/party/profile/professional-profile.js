const DataObject = require("mod/data/model/data-object").DataObject;
const Montage = require("mod/core/core").Montage;

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
exports.ProfessionalProfile = class ProfessionalProfile extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            hostingOrganization: { value: undefined },
            owner: { value: undefined },
            url: { value: undefined },
        });
    }
};
