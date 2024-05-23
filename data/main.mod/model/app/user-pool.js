const UserSession = require("app-infrastructure-data.mod/data/main.mod/model/user-pool").UserPool,
    Montage = require("mod/core/core").Montage;

/**
 * @class UserPool
 * @extends Object
 */

Montage.defineProperties(UserPool.prototype, {
    servedOrganizations: {value: undefined}
});