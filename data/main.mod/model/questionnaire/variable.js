var ModVariable = require("mod/data/model/variable").Variable;

/**
 * @class Variable
 * @extends ModVariable
 */

/*
    TODO: Add variables
*/

exports.Variable = ModVariable.specialize(/** @lends Variable.prototype */ {
    constructor: {
        value: function Variable() {
            this.super();
            return this;
        }
    },

    questionnaires: {
        value: undefined
    },
    questions: {
        value: undefined
    },
    respondentQuestionnaireVariableValuess: {
        value: undefined
    }
});
