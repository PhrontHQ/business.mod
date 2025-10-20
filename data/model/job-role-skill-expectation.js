var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class JobRoleSkillExpectation
 * @extends DataObject
 */


exports.JobRoleSkillExpectation = DataObject.specialize(/** @lends JobRoleSkillExpectation.prototype */ {
    constructor: {
        value: function JobRoleSkillExpectation() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    proficencyScale: {
        value: undefined
    }

});
