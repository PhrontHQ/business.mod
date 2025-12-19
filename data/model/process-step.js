var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class ProcessStep
 * @extends DataObject
 */


exports.ProcessStep = DataObject.specialize(/** @lends ProcessStep.prototype */ {
    constructor: {
        value: function ProcessStep() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    process: {
        value: undefined
    },
    tasks: {
        value: undefined
    }

});
