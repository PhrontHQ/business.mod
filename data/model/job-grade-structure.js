var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class JobGrade
 * @extends DataObject
 */


exports.JobGradeStructure = DataObject.specialize(/** @lends JobGradeStructure.prototype */ {
    constructor: {
        value: function JobGradeStructure() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    jobGrades: {
        value: undefined
    },
    bottomUpHierarchyLevelOrder: {
        value: undefined
    }

});
