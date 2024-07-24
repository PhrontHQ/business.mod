var DataObject = require("mod/data/model/data-object").DataObject;
/**
 * @class Tangible
 * @extends DataObject
 */


 /*
 */


exports.Tangible = DataObject.specialize(/** @lends Tangible.prototype */ {
    constructor: {
        value: function Tangible() {
            this.super();
            return this;
        }
    },

    /**
     * name
     * 
     * @property {String}
     */
    name: {
        value: undefined
    }

});
