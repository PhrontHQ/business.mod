var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class Workflow
 * @extends DataObject
 */


exports.Workflow = DataObject.specialize(/** @lends Workflow.prototype */ {
    constructor: {
        value: function Workflow() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    descriptiom: {
        value: undefined
    },
    phases: {
        value: undefined
    }

});
