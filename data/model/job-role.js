const Role = require("mod/data/model/party/role").Role;
const Montage = require("mod/core/core").Montage;

/**
 * @class JobRole
 * @extends DataObject
 */
exports.JobRole = class JobRole extends Role {
    static {
        Montage.defineProperties(this.prototype, {
            responsibilities: { value: undefined },
            jobs: { value: undefined },
        });
    }
};
