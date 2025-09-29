var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class RespondentQuestionnaireVariableValue
 * @extends DataObject
 */

/*
    TODO: Add variables
*/

exports.RespondentQuestionnaireVariableValue = DataObject.specialize(/** @lends RespondentQuestionnaireVariableValue.prototype */ {
    constructor: {
        value: function RespondentQuestionnaireVariableValue() {
            this.super();
            return this;
        }
    },

    respondentQuestionnaire: {
        value: undefined
    },
    questionnaireVariable: {
        value: undefined
    },
    values: {
        value: undefined
    }
});
