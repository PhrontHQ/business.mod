const Application = require("mod/data/model/app/application").Application,
    Montage = require("mod/core/core").Montage;

/**
 * @class Application
 * @extends Object
 */

exports.Application = Application;

Montage.defineProperties(Application.prototype, {
    controllingOrganization: {value: undefined}
});