var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class RoleRanking
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Montage
 */


exports.RoleRanking = DataObject.specialize(/** @lends RoleRanking.prototype */ {
    role: {
        value: undefined
    },
    ranking: {
        value: undefined
    }
});
