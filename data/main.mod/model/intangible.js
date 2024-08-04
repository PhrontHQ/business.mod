var Thing = require("./thing").Thing;
/**
 * @class Intangible
 * @extends Thing
 */


 /*
 */


exports.Intangible = Thing.specialize(/** @lends Intangible.prototype */ {
    constructor: {
        value: function Intangible() {
            this.super();
            return this;
        }
    }

});
