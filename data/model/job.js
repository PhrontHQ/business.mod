const DataObject = require("mod/data/model/data-object").DataObject;
const Montage = require("mod/core/core").Montage;

/**
 * @class Job
 * @extends DataObject
 */

exports.Job = class Job extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            title: { value: undefined },
            roles: { value: undefined },
            employmentPositions: { value: undefined },
        });
    }
};
