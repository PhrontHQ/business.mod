var DataObjectType = require("./data-object-type").DataObjectType;
/**
 * @class OrganizationType
 * @extends DataObjectType
 */


exports.OrganizationType = DataObjectType.specialize(/** @lends OrganizationType.prototype */ {

    organizations: {
        value: undefined
    }

});
