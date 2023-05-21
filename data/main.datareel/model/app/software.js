/**
    @module phront/data/main.datareel/model/app/software
*/

var DataObject = require("../data-object").DataObject;

/**
 * @class Software
 * @extends DataObject
 *
 */

exports.Software = DataObject.specialize(/** @lends Software.prototype */ {
    constructor: {
        value: function Software() {
            this.super();
            return this;
        }
    },

    /**
     * The specific app that is run by the client. We should have the matching object
     * known in the databse, with version and all, from a publish done by a user
     * authorized to do so before
     */
    app: {
        value: undefined
    },

    /**
     * the softwareAgent client of the session. The software agent is what runs the app.
     * For client side apps, it's a browser or a custom app.
     * For the cloud, it would be the API Gateway lambda environment,
     *  which like client apps has a JavaScript runtime. Another piece of software
     */
    softwareAgent: {
        value: undefined
    },

    /*
        The device the softwareAgent is running on
    */
    device: {
        value: undefined
    },

    /**
     * The WebSocket connectionId that’s created and provided by AWS API Gateway
     */
    connectionId: {
        value: undefined
    },

    /**
     * The time range modeling the beginning and end of the session
     */
    durationTimeRange: {
        value: undefined
    },

    /**
     * The locale used by the app, over time if it changes.
     * Most of the time we'll have only one
     *
     * @property {Array<Range<Date>>} value
     */
    localeTimeLog: {
        value: undefined
    },

    /**
     * The locale used by the app, over time if it changes.
     * Most of the time we'll have only one
     *
     * @property {Array<Range<Date>>} value
     */
    timeZoneTimeLog: {
        value: undefined
    },

    /**
     * The locale used by the app, over time if it changes.
     * Most of the time we'll have only one
     *
     * @property {Array<Windows>} value
     */
    windows: {
        value: undefined
    }

});
