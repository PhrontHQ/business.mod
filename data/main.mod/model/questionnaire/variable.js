var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class Variable
 * @extends DataObject
 */

/*
    TODO: Add variables
*/

exports.Variable = DataObject.specialize(/** @lends Variable.prototype */ {
    constructor: {
        value: function Variable() {
            this.super();
            return this;
        }
    },

    name: {
        value: undefined
    },
    displayName: {
        value: undefined
    },
    type: {
        value: undefined
    },
    questionnaires: {
        value: undefined
    },
    questions: {
        value: undefined
    }
});
