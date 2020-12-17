var DataObject = require("../data-object").DataObject;

/**
 * @class RespondentQuestionnaireAnswer
 * @extends DataObject
 */

/*
    TODO: Add variables
*/

exports.RespondentQuestionnaireAnswer = DataObject.specialize(/** @lends RespondentQuestionnaireAnswer.prototype */ {
    constructor: {
        value: function RespondentQuestionnaireAnswer() {
            this.super();
            return this;
        }
    },

    respondentQuestionnaire: {
        value: undefined
    },
    questionnaireQuestion: {
        value: undefined
    },
    answers: {
        value: undefined
    },
    completionDate: {
        value: undefined
    },
    respondentNotes: {
        value: undefined
    }

});
