var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class PersonalSkillAssessment
 * @extends DataObject
 */


exports.PersonalSkillAssessment = DataObject.specialize(/** @lends PersonalSkillAssessment.prototype */ {
    constructor: {
        value: function PersonalSkillAssessment() {
            this.super();
            return this;
        }
    },
    person: {
        value: undefined
    },
    skill: {
        value: undefined
    },
    selfAssessedProficencyLevel: {
        value: undefined
    },
    assessmentQuestionnaires: {
        value: undefined
    },
    assessmentQuestionnaires: {
        value: undefined
    }

});
