var Party = require("./party").Party;

/**
 * @class WorkTeam
 * @extends Party
 */


 /*

 TODO: add timeRanges to model Operating Hours	Operating hours	Specifies a time zone and associated time slots for a branch or office location.

 There could be a morningOperationTimeRange,
 A range of "days" can have an array of ranges of operating hours

 That should give us enough flexibility

 */


exports.WorkTeam = Party.specialize(/** @lends WorkTeam.prototype */ {
    constructor: {
        value: function WorkTeam() {
            this.super();
            return this;
        }
    }

});
