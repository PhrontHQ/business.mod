var Party = require("./party").Party;

/**
 * @class Thing
 * @extends Party
 */


 /*

 TODO: add timeRanges to model Operating Hours	Operating hours	Specifies a time zone and associated time slots for a branch or office location.

 There could be a morningOperationTimeRange,
 A range of "days" can have an array of ranges of operating hours

 That should give us enough flexibility

 */


exports.Thing = Party.specialize(/** @lends Thing.prototype */ {
    constructor: {
        value: function Thing() {
            this.super();
            return this;
        }
    },
    type: {
        value: undefined
    }

});
