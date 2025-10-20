var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class PersonalStrength
 * @extends DataObject
 */


exports.PersonalStrength = DataObject.specialize(/** @lends PersonalStrength.prototype */ {
    constructor: {
        value: function PersonalStrength() {
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
