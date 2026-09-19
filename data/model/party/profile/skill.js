var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class Skill
 * @extends DataObject
 */


exports.Skill = DataObject.specialize(/** @lends Skill.prototype */ {
    constructor: {
        value: function Skill() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    proficiencyScale: {
        value: undefined
    }

});
