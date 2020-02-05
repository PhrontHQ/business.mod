var Target = require("montage/core/target").Target;

/**
 * @class EventPerson
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


exports.EventPerson = Target.specialize(/** @lends EventPerson.prototype */ {
    constructor: {
        value: function EventPerson() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    id: {
        value: undefined
    },
    email: {
        value: undefined
    },
    displayName: {
        value: undefined
    },
    self: {
        value: undefined
    }
});
