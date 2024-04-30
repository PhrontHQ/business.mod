var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class Gender
 * @extends DataObject
 * @classdesc Represents a Person's gender.
 *
 */

exports.Gender = DataObject.specialize(/** @lends Gender.prototype */ {
    constructor: {
        //support a signature like (colorSpace, channel1, channel2, channel3, channel4, name)
        //or (colorSpace, [channel1, channel2, channel3, channel4], name)
        value: function Gender() {
            return this;
        }
    },

    name: {
        value: undefined
    }


});
