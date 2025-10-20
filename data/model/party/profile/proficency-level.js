var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class ProficencyScale
 * @extends DataObject
 */


exports.ProficencyScale = DataObject.specialize(/** @lends ProficencyScale.prototype */ {
    constructor: {
        value: function ProficencyScale() {
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
