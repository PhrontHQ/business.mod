var Object = require("./object").Object;
/**
 * @class Person
 * @extends Object
 */


exports.Party = Object.specialize(/** @lends Person.prototype */ {

    existenceTimeRange: {
        value: undefined
    }

});