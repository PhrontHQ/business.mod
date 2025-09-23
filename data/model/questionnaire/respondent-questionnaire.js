var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class RespondentQuestionnaire
 * @extends DataObject
 */

/*
    TODO: Add variables
*/

exports.RespondentQuestionnaire = DataObject.specialize(/** @lends RespondentQuestionnaire.prototype */ {
    constructor: {
        value: function RespondentQuestionnaire() {
            this.super();
            return this;
        }
    },

    person: {
        value: undefined
    },
    questionnaire: {
        value: undefined
    },
    personAnswers: {
        value: undefined
    },
    completionDate: {
        value: undefined
    },
    pdfExport: {
        value: undefined
    },
    notes: {
        value: undefined
    }

});
