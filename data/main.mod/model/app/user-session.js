const UserSession = require("app-infrastructure-data.mod/data/main.mod/model/user-session").UserSession,
    Montage = require("mod/core/core").Montage;

/**
 * @class UserSession
 * @extends UserSession
 */

Montage.defineProperties(UserSession.prototype, {
    person: {value: undefined}
});