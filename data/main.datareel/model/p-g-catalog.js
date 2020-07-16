var Montage = require("montage").Montage;

/**
 * @class PGCatalog
 * Models afrer https://help.shopify.com/en/api/graphql-admin-api/reference/object/collection
 * @extends Montage
 */


exports.PGCatalog = Montage.specialize(/** @lends PGCatalog.prototype */ {
    namespaceName: {
        value: undefined
    },
    oid: {
        value: undefined
    }

});
