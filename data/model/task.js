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
     * The order a task would be executed relative to others in a sequence
     * E.g., this is task 4 in a 8 step task list ... 
     * 
     * @property {Number} value
     * @default undefined
     */
    executionSequencePosition: {
        value: undefined
    },
    
    /**
     * Wether the execution of a Task is tracked or not
     *
     * @property {boolean} value
     * @default false
     */
    isTracked: {
        value: false
    },

    /**
     * Wether a Task is considered critical or not
     *
     * @property {boolean} value
     * @default false
     */
    isCritical: {
        value: false
    },


    /**
     *
     * @property {Task[]} value
     * @default undefined
     */
    upstreamTasks: {
        value: undefined
    },

    /**
     * Part(s) utilized by this task
     *
     * @property {Task[]} value
     * @default null
     */
    downstreamTasks: {
        value: undefined
    },

    /**
     * Part(s) utilized by this task
     *
     * @property {Task[]} value
     * @default null
     */
    prerequisiteTasks: {
        value: undefined
    },

    /**
     * Wether a Task is started or not
     *
     * @property {boolean} value
     * @default false
     */
    isStarted: {
        value: false
    },
    
    /**
     * Wether a Task has been completed
     *
     * @property {boolean} value
     * @default false
     */
    isCompleted: {
        value: false
    },

    /**
     * 
     * @property {Number} value
     * @default undefined
     */
    resetCount: {
        value: undefined
    },

    /**
     * Wether a Task has been reset, once or more
     *
     * @property {boolean} value
     * @default false
     */
    isReset: {
        value: false
    },
    
    /**
     * 
     * @property {Number} value
     * @default undefined
     */
    plannedExecutionDuration: {
        value: undefined
    },
    
    /**
     * The list of Issues configured as types for others a task can have (type as in JS' prototype sense 
     * - an object from which others inherits their shape and value)
     * @property {Issue[]} value
     * @default undefined
     */
    issueTypes: {
        value: undefined
    },

    /**
     * eventual issues related to the execution of a task
     * @property {Issue[]} value
     * @default undefined
     */
    issues: {
        value: undefined
    }    
    
});
