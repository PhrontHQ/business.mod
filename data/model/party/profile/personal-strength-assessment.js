var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class PersonalStrengthAssessment
 * @extends DataObject
 */


exports.PersonalStrengthAssessment = DataObject.specialize(/** @lends PersonalStrengthAssessment.prototype */ {
    constructor: {
        value: function PersonalStrengthAssessment() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    proficencyScale: {
        value: undefined
    }

});
