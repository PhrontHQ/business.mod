var Object = require("./object").Object;

/**
 * @class Collection
 * Models afrer https://help.shopify.com/en/api/graphql-admin-api/reference/object/collection
 * @extends Montage
 */


exports.Collection = Object.specialize(/** @lends Collection.prototype */ {

    title: {
        value: undefined
    },
    description: {
        value: undefined
    },
    descriptionHtml: {
        value: undefined
    },
    image: {
        value: undefined
    },
    ruleSet: {
        value: undefined
    },
    _products: {
        value: undefined
    },
    products: {
        get: function() {
            return this._products;
        },
        set: function(value) {
             this._products = value;
        }

    }

}); 