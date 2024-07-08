const UserSession = require("mod/data/model/app/user-session").UserSession,
    Montage = require("mod/core/core").Montage;

/**
 * @class UserSession
 * @extends UserSession
 */
exports.UserSession = UserSession;

Montage.defineProperties(UserSession.prototype, {
    person: {value: undefined}
});