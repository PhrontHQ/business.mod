/**
    @module business-data.mod/data/main.mod/model/app/user-agent-window
*/

var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class UserAgentWindow
 * @extends UserPool
 *
 * An UserPool creates the structure to host collections of users, app clients, devices
 * that typically belongs to an organization. There might be multiple reason and strategies
 * for on party (Organization, person) to use multiple pools.
 *
 */

exports.UserAgentWindow = DataObject.specialize(/** @lends UserAgentWindow.prototype */ {
    constructor: {
        value: function UserAgentWindow() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    /**
     * The time range models when the window is opened and closed.
     * By default there will be one.
     */
    durationTimeRange: {
        value: undefined
    },

    /**
     * The position of the window over time.
     * An array of LogEntry objects:
     *  {
     *      time: aDate,
     *      value: aPoint
     *  }
     *
     * @property {Array<PointLogEntry>>} value
     */
    positionTimeLog: {
        value: undefined
    },

    /**
     * The size of the window over time.
     * An array of LogEntry objects:
     *  {
     *      time: aDate,
     *      value: aUserAgentWindowSize
     *  }
     *
     * @property {Array<PointLogEntry>>} value
     */
    sizeTimeLog: {
        value: undefined
    },

    /**
     * The screen the window is on over time.
     * An array of LogEntry objects:
     *  {
     *      time: aDate,
     *      value: aScreen
     *  }
     * If a screen chatacteristics were to change while a window is on it,
     * like a user tweaking it's computer display settings, like changing resolution,
     * we would add a new screen in the log with the new characteristics,
     * if we were able track that and know about it.
     *
     * @property {Array<PointLogEntry>>} value
     */
     screenTimeLog: {
        value: undefined
    }

});
