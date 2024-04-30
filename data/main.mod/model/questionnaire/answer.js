var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class Answer
 * @extends DataObject
 */

/*
    TODO: Add variables
*/

exports.Answer = DataObject.specialize(/** @lends Answer.prototype */ {
    constructor: {
        value: function Answer() {
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
