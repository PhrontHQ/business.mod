var Montage = require("montage/core/core").Montage;

/**
 * @class CollectionRuleSet
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/collectionruleset
 * @extends Montage
 */


exports.CollectionRuleSet = Montage.specialize(/** @lends CollectionRuleSet.prototype */ {

    appliedDisjunctively: {
        value: undefined
    },
    rules: {
        value: undefined
    }

});
