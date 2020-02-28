var Montage = require("montage").Montage;

/**
 * @class EventPerson
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


exports.EventPerson = Montage.specialize(/** @lends EventPerson.prototype */ {
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
    isSelf: {
        value: undefined
    },
    person: {
        value: undefined
    }
});
