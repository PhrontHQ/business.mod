var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class Questionnaire
 * @extends DataObject
 */

/*
    TODO: Add variables
*/

exports.Questionnaire = DataObject.specialize(/** @lends Questionnaire.prototype */ {
    constructor: {
        value: function Questionnaire() {
            this.super();
            return this;
        }
    },

    name: {
        value: undefined
    },
    title: {
        value: undefined
    },
    headerVisual: {
        value: undefined
    },
    description: {
        value: undefined
    },
    questions: {
        value: undefined
    },
    userContextVariables: {
        value: undefined
    }

});
