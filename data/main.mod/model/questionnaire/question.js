var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class Question
 * @extends DataObject
 */

/*
    TODO: Add variables
*/

exports.Question = DataObject.specialize(/** @lends Question.prototype */ {
    constructor: {
        value: function Question() {
            this.super();
            return this;
        }
    },

    text: {
        value: undefined
    },
    name: {
        value: undefined
    },
    isOpenEnded: {
        value: undefined
    },

    /*
        TODO: Add variables to ObjectDescriptor
    */
    variables: {
        value: undefined
    }
});
