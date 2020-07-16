var Party = require("./party").Party;

/**
 * @class Resource
 * @extends Object
 */


exports.Resource = Party.specialize(/** @lends Resource.prototype */ {
    constructor: {
        value: function Resource() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    }

});
