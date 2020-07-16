var Asset = require("./asset").Asset;

/**
 * @class Image
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


exports.Image = Asset.specialize(/** @lends Image.prototype */ {
    constructor: {
        value: function Image() {
            this.super();
            //console.log("Phront Image created");
            return this;
        }
    },

    altText: {
        value: undefined
    },
    originalSrc: {
        value: undefined
    },
    transformedSrc: {
        value: undefined
    },
    exifMetadata: {
        value: undefined
    }

});
