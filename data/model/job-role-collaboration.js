var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class JobRoleCollaboration
 * @extends DataObject
 */


exports.JobRoleCollaboration = DataObject.specialize(/** @lends JobRoleCollaboration.prototype */ {
    constructor: {
        value: function JobRoleCollaboration() {
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
