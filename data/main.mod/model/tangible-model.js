var Intangible = require("./intangible").Intangible;
/**
 * @class TangibleModel
 * @extends Thing
 */


 /*
 */


exports.TangibleModel = Intangible.specialize(/** @lends TangibleModel.prototype */ {
    constructor: {
        value: function TangibleModel() {
            this.super();
            return this;
        }
    }

});
