var Party = require("./party").Party;

/**
 * @class Organization
 * @extends Party
 */


 /*

 TODO: add timeRanges to model Operating Hours	Operating hours	Specifies a time zone and associated time slots for a branch or office location.

 There could be a morningOperationTimeRange,
 A range of "days" can have an array of ranges of operating hours

 That should give us enough flexibility

 */


exports.Organization = Party.specialize(/** @lends Organization.prototype */ {
    constructor: {
        value: function Organization() {
            this.super();
            return this;
        }
    },
    type: {
        value: undefined
    },
    parent: {
        value: undefined
    },
    suborganizations: {
        value: undefined
    },
    tags: {
        value: undefined
    },
    mainContact: {
        value: undefined
    },
    employmentPositions: {
        value: undefined
    },
    b2cCustomerRelationships: {
        value: undefined
    },
    b2bCustomerRelationships: {
        value: undefined
    },
    supplierRelationships: {
        value: undefined
    },
    userPools: {
        value: undefined
    },
    applications: {
        value: undefined
    }

});
