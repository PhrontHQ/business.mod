var Montage = require("montage").Montage;

/**
 * @class CollectionRule
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Montage
 */


exports.Image = Montage.specialize(/** @lends Image.prototype */ {

    altText: {
        value: undefined
    },
    originalSrc: {
        value: undefined
    },
    transformedSrc: {
        value: undefined
    }

});