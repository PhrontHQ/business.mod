var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class QuestionnaireQuestion
 * @extends DataObject
 */

/*
    TODO: Add variables

    From https://www.qualtrics.com/support/survey-platform/survey-module/question-options/carry-forward-choices/

    About Carry Forward Choices:
    Carry Forward allows you to copy specific answer choices from one question and bring them into a future question in your survey. For instance, you can first show your respondents a question that asks which products they have bought from your company in the last six months. You can then carry forward the choices they selected into the next question and ask the respondents to rank their preference from those previously selected choices only.

    We should implement this with bindings

    About Display Logic
    You can use Display Logic to create a survey that is customized to each respondent. When a specific question or answer choice pertains only to certain respondents, you can set Display Logic on it so that it shows conditionally, based on previous information. You can choose to conditionally display both questions and answer choices, allowing you to create a survey that dynamically adapts to your respondent’s answers.

    https://www.qualtrics.com/support/survey-platform/survey-module/editing-questions/validation/


*/

exports.QuestionnaireQuestion = DataObject.specialize(/** @lends QuestionnaireQuestion.prototype */ {
    constructor: {
        value: function QuestionnaireQuestion() {
            this.super();
            return this;
        }
    },

    questionnaire: {
        value: undefined
    },
    question: {
        value: undefined
    },
    questionnairePosition: {
        value: undefined
    },
    questionnaireLabel: {
        value: undefined
    },

    /**
     * An frb expression / criteria that if true the question should be
     * didplayed, if false, not. Should we store this in teh DB as a criteria?
     * serialized? Should we save an expression's syntactic tree?
     *
     * Context from https://www.qualtrics.com/support/survey-platform/survey-module/question-options/display-logic/:
     * You can use Display Logic to create a survey that is customized to each
     * respondent. When a specific question or answer choice pertains only to
     * certain respondents, you can set Display Logic on it so that it shows
     * conditionally, based on previous information. You can choose to
     * conditionally display both questions and answer choices, allowing you to
     * create a survey that dynamically adapts to your respondent’s answers.
     *
     *
     * URGENT: how do we model this, where there's a shared sentence covering
     * multiple answers like this:
     *
     * Do you, your child, or others accompanying you to today’s appointment or
     * other recent acquaintances have:
     *
     *   • A Fever (defined as above 99.6 degrees)
     *                 Yes / No
     *
     *   • A Cough?
     *                 Yes / No
     *
     *   • Shortness of Breath and/or Trouble Breathing?
     *                 Yes / No
     *
     *   • Persistent Pain, Pressure, or Tightness in the Chest?
     *                 Yes / No
     *
     *
     * @property
     * @returns {Criteria? Expression?} - ??
     */

    displayLogicExpression: {
        value: undefined
    },
    possibleAnswers: {
        value: undefined
    },
    maximumNumberOfAnswer: {
        value: undefined
    }

});
