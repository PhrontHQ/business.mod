var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class Job
 * @extends DataObject
 */


exports.Job = DataObject.specialize(/** @lends Job.prototype */ {
    constructor: {
        value: function Job() {
            this.super();
            return this;
        }
    },
    title: {
        value: undefined
    },
    roles: {
        value: undefined
    },
    employmentPositions: {
        value: undefined
    }

});
