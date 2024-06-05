const Application = require("mod/data/model/app/application").Application,
    Montage = require("mod/core/core").Montage;

/**
 * @class Application
 * @extends Object
 */

Montage.defineProperties(Application.prototype, {
    controllingOrganization: {value: undefined}
});