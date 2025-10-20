var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class ProficencyLevel
 * @extends DataObject
 */


exports.ProficencyLevel = DataObject.specialize(/** @lends ProficencyLevel.prototype */ {
    constructor: {
        value: function ProficencyLevel() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    scale: {
        value: undefined
    }

});
