var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class Issue
 * @extends DataObject
 * 
 * Properties are pulled combined from the utilized components from Slalom & GSPAS responses
 */

exports.Issue = DataObject.specialize(/** @lends Issue.prototype */ {

    /**
     * doo doo doo, da da da
     *
     * @property {String} value
     * @default null
     */
    title: {
        value: undefined
    },


    /**
     * The list of values the severity property can take
     *
     * @property {String} value
     * @default null
     */
    possibleSeverityValues: {
        value: undefined
    },

    /**
     * The severity of an issue
     *
     * @property {Date} value
     * @default null
     */
    severity: {
        value: undefined
    },

    /**
     * The list of values the priority property can take
     *
     * @property {Date} value
     * @default null
     */
    possiblePriorityValues: {
        value: undefined
    },

    /**
     * The priority assigned to an issue
     *
     * @property {String} value
     * @default null
     */
    priority: {
        value: undefined
    },

    /**
     * The list of values the resolutionStatus property can take
     *
     * @property {String} value
     * @default null
     */
    possibleResolutionStatusValues: {
        value: undefined
    },

    /**
     * Part 'suffix' -- part of the greater 'number' identifier for a part
     *
     * @property {String} value
     * @default null
     */
    resolutionStatus: {
        value: undefined
    },

    /**
     * The person currently assigned to handle an issue
     *
     * @property {Person} value
     * @default null
     */
    assignee: {
        value: undefined
    }

});
