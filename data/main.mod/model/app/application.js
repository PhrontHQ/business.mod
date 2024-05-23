const UserSession = require("app-infrastructure-data.mod/data/main.mod/model/application").Application,
    Montage = require("mod/core/core").Montage;

/**
 * @class Application
 * @extends Object
 */

Montage.defineProperties(Application.prototype, {
    controllingOrganization: {value: undefined}
});