var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class Process
 * @extends DataObject
 */


exports.Process = DataObject.specialize(/** @lends Process.prototype */ {
    constructor: {
        value: function Process() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    steps: {
        value: undefined
    },
    phases: {
        value: undefined
    }

});
