var DataObject = require("./data-object").DataObject;

/**
 * @class RoleRankedPartyPhoneNumber
 * @extends DataObject
 */


exports.RoleRankedPartyPhoneNumber = DataObject.specialize(/** @lends RoleRankedPartyPhoneNumber.prototype */ {
    role: {
        value: undefined
    },
    ranking: {
        value: undefined
    },
    partyPhoneNumber: {
        value: undefined
    }
});
