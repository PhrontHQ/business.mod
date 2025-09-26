var Party = require("./party/party").Party;

/**
 * @class Position
 * @extends DataObject
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
