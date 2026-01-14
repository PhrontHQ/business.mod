const Profile = require("mod/data/model/party/profile").Profile,
    Montage = require("mod/core/core").Montage;

/**
 * @class Profile
 * @extends Intangible
 */


exports.Profile = Profile;

Montage.defineProperties(Party.prototype, {
    /**
     * @property {Device[]}
     * @public
     */
    representedPartyDevices: { value: undefined },
});

