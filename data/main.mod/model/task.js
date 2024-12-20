var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class Task
 * @extends DataObject
 * 
 */

exports.Task = DataObject.specialize(/** @lends Task.prototype */ {

    /**
     * Title of the task (human readable?)
     *
     * @property {String} value
     * @default null
     */
    title: {
        value: undefined
    },

    /**
     * Description of the task (human readable 'action' as described by ProcessElement)
     *
     * @property {String} value
     * @default null
     */
    description: {
        value: undefined
    },

    /**
     * Process Sheet / Element ID (for us to reference the immutable process element?)
     *
     * @property {String} value
     * @default null
     */
    processSheetId: {
        value: undefined
    },

    /**
     * The order a task would be executed relative to others in a sequence
     * E.g., this is task 4 in a 8 step task list ... 
     * 
     * @property {Number} value
     * @default null
     */
    executionSequencePosition: {
        value: undefined
    },

    /**
     * Tool(s) utilized by this task
     * Allows us to use common tool 'structure' between both GSPAS process sheets and/or our tasks/vehicles ... 
     *
     * @property {Tools[]} value
     * @default null
     */
    associatedTools: {
        value: undefined
    },

    /**
     * Part(s) utilized by this task
     *
     * @property {Parts[]} value
     * @default null
     */
    partsUsed: {
        value: undefined
    }
});
