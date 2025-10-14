var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class WorkTeamMembership
 * @extends DataObject
 */


exports.WorkTeamMembership = DataObject.specialize(/** @lends WorkTeamMembership.prototype */ {
    constructor: {
        value: function WorkTeamMembership() {
            this.super();
            return this;
        }
    },
    workTeam: {
        value: undefined
    },
    party: {
        value: undefined
    },
    role: {
        value: undefined
    }

});
