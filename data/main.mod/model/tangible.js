var Thing = require("./thing").Thing;
/**
 * @class Tangible
 * @extends Thing
 */


 /*
 */


exports.Tangible = Thing.specialize(/** @lends Tangible.prototype */ {
    constructor: {
        value: function Tangible() {
            this.super();
            return this;
        }
    }


});
