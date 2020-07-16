var Montage = require("montage").Montage;

/**
 * @class PGClass
 * Models afrer https://help.shopify.com/en/api/graphql-admin-api/reference/object/collection
 * @extends Montage
 */


exports.PGClass = Montage.specialize(/** @lends PGClass.prototype */ {
    name: {
        value: undefined
    },
    oid: {
        value: undefined
    },
    kind: {
        value: undefined
    }

});
