var Montage = require("mod/core/core").Montage;

/**
 * @class CollectionRule
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/collectionrule
 * @extends Montage
 */


exports.CollectionRule = Montage.specialize(/** @lends CollectionRule.prototype */ {

    column: {
        value: undefined
    },
    condition: {
        value: undefined
    },
    relation: {
        value: undefined
    }

});
