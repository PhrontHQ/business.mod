var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class Deliverable
 * @extends DataObject
 */


exports.Deliverable = DataObject.specialize(/** @lends Deliverable.prototype */ {
    constructor: {
        value: function Deliverable() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    }

});
