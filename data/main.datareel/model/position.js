var Party = require("./party").Party;

/**
 * @class Position
 * @extends Object
 */


exports.Position = Party.specialize(/** @lends Position.prototype */ {
    constructor: {
        value: function Position() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    role: {
        value: undefined
    }

});
