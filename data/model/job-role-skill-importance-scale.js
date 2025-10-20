var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class JobRoleSkillImportanceScale
 * @extends DataObject
 */


exports.JobRoleSkillImportanceScale = DataObject.specialize(/** @lends JobRoleSkillImportanceScale.prototype */ {
    constructor: {
        value: function JobRoleSkillImportanceScale() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    levels: {
        value: undefined
    }

});
