var Role = require("mod/data/model/data-object").Role;

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
