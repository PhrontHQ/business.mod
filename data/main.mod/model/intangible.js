var DataObject = require("mod/data/model/data-object").DataObject;
/**
 * @class Intangible
 * @extends DataObject
 */


 /*
 */


exports.Intangible = DataObject.specialize(/** @lends Intangible.prototype */ {
    constructor: {
        value: function Intangible() {
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
