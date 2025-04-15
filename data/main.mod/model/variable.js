var Intangible = require("./intangible").Intangible;

/**
 * @class Variable
 * @extends DataObject
 */

/*
    TODO: Add variables
*/

exports.Variable = Intangible.specialize(/** @lends Variable.prototype */ {
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
    }
});
