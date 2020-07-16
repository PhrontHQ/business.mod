var Object = require("./object").Object;

/**
 * @class Role
 * @extends Object
 */

 /*
    Roles expected to be created in the database:

    Events:
    - Organizer


    ServiceEngagement:
    - Service Provider
    - Masseur
    - Masseuse
    - Hair Dresser
    - Concellor
    - Coach
    - Instructor

    Family Relations: -> tags
    - Spouse
    - Partner
    - Daughter
    - Son
    - Child
    - Father
    - Mother
    - Parent
    - Brother
    - Sister
    - Friend
    - Grandfather
    - Grandmother
    - Grandparent
    - Granddaughter
    - Grandson
    - Grandchild
    - Uncle
    - Aunt
    - Nephew
    - Niece

Work Relations:
    - Assistant
    - Manager


*/


exports.Role = Object.specialize(/** @lends Role.prototype */ {
    constructor: {
        value: function Role() {
            this.super();
            //console.log("Phront Role created");
            return this;
        }
    },

    name: {
        value: undefined
    },
    description: {
        value: undefined
    },
    tags: {
        value: undefined
    }

});
