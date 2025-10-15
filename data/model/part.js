var Tangible = require("mod/data/model/party/tangible").Tangible;

/**
 * @class Part
 * @extends Tangible
 * 
 * Properties are pulled combined from the utilized components from Slalom & GSPAS responses
 */

exports.Part = Tangible.specialize(/** @lends Part.prototype */ {

    /**
     * doo doo doo, da da da
     *
     * @property {String} value
     * @default null
     */
    name: {
        value: undefined
    },


    /**
     * 'Number' which is actually the full string identifier for the part
     * Fun fact - part numbers include letters in the automotive space :)
     *
     * @property {String} value
     * @default null
     */
    partNumber: {
        value: undefined
    },

    /**
     * Date Range in which part is 'effective,' meaning the part was swapped into usage 
     * Can potentially be in the future.
     *
     * @property {Range<Date>} value
     * @default null
     */
    productionUseDateRange: {
        value: undefined
    },

    /**
     * Part 'prefix' -- part of the greater 'number' identifier for a part
     *
     * @property {String} value
     * @default null
     */
    prefix: {
        value: undefined
    },

    /**
     * Part 'base' -- part of the greater 'number' identifier for a part
     *
     * @property {String} value
     * @default null
     */
    base: {
        value: undefined
    },

    /**
     * Part 'suffix' -- part of the greater 'number' identifier for a part
     *
     * @property {String} value
     * @default null
     */
    suffix: {
        value: undefined
    },

    /**
     * Part 'suffix' -- part of the greater 'number' identifier for a part
     *
     * @property {String} value
     * @default null
     */
    unitType: {
        value: undefined
    },

    /**
     * List of tasks utilizing the part ... inverse of 'parts used' on the task
     *
     * @property {Task[]} value
     * @default null
     */
    associatedTasks: {
        value: undefined
    },

    /**     *
     * @property {UsageConditionCode[]} value
     * @default null
     */
    needsTraceability: {
        value: undefined
    }
});
