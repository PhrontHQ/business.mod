var Target = require("montage/core/target").Target,

/**
 * @class Image
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


exports.Calendar = Target.specialize(/** @lends Calendar.prototype */ {
    constructor: {
        value: function Calendar() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    id: {
        value: undefined
    },
    kind: {
        value: undefined
    },
    etag: {
        value: undefined
    },
    summary: {
        value: undefined
    },
    description: {
        value: undefined
    },
    location: {
        value: undefined
    },
    conferenceProperties: {
        value: undefined
    }
});