var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class WorkflowPhase
 * @extends DataObject
 */


exports.WorkflowPhase = DataObject.specialize(/** @lends WorkflowPhase.prototype */ {
    constructor: {
        value: function WorkflowPhase() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    tasks: {
        value: undefined
    }

});
