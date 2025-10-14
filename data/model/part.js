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
    number: {
        value: undefined
    },

    /**
     * Date in which part was 'effective,' meaning the part was swapped into usage at the plant
     * Can potentially be in the future.
     *
     * @property {Date} value
     * @default null
     */
    usageStartDate: {
        value: undefined
    },

    /**
     * Date in which a part was no longer 'effective,' meaning the part was retired in favor of a new version.
     * Can potentially be in the future.
     *
     * @property {Date} value
     * @default null
     */
    usageEndDate: {
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
     * 'Activity' code, not really sure what this means.
     * TODO: ask for meaning
     *
     * @property {String} value
     * @default null
     */
    activity: {
        value: undefined
    },

    /**
     * CPSC - code provided by GSPAS, need to ask for context.
     * TODO: ask for meaning
     *
     * @property {String} value
     * @default null
     */
    cpsc: {
        value: undefined
    },

    /**
     * NoticeActivity - code provided by GSPAS, need to ask for context.
     * TODO: ask for meaning
     *
     * @property {String} value
     * @default null
     */
    noticeActivity: {
        value: undefined
    },

    /**
     * TaskInfo
     *
     * @property {String} value
     * @default null
     */
    noticeActivity: {
        value: undefined
    },

    /**
     * List of tasks utilizing the part ... inverse of 'parts used' on the task
     *
     * @property {Task[]} value
     * @default null
     */
    tasksUsingPart: {
        value: undefined
    },

    /**
     * List of usage condition codes associated with this part
     * According to GSPAS team, one part can be assocaited with more than one usage cond. code
     *
     * @property {UsageConditionCode[]} value
     * @default null
     */
    tasksUsingPart: {
        value: undefined
    }
});
