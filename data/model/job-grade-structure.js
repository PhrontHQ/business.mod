var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class JobGrade
 * @extends DataObject
 */


exports.JobGrade = DataObject.specialize(/** @lends JobGrade.prototype */ {
    constructor: {
        value: function JobGrade() {
            this.super();
            return this;
        }
    },
    jobRole: {
        value: undefined
    },
    collaboratingParty: {
        value: undefined
    }

});
