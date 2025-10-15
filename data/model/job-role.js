var Role = require("mod/data/model/party/role").Role;

/**
 * @class Job
 * @extends DataObject
 */


exports.JobRole = Role.specialize(/** @lends Job.prototype */ {
    constructor: {
        value: function Job() {
            this.super();
            return this;
        }
    },
    responsibilities: {
        value: undefined
    },
    jobs: {
        value: undefined
    }

});
