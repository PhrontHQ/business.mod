/**
    @module phront/data/main.datareel/model/app/web-socket-session
*/

var Montage = require("montage/core/core").Montage;

/**
 * @class WebSocketSessionConnection
 * @extends DataObject
 *
 * A WebSocketSessionConnection is the representation of a client agent connecting
 * via a WebSocket to serverlss DataWorkers for a continuous period of time
 * a WebSocketSession has an array of WebSocketSessionConnection, which happens
 * if a client keeps running while the APIGateway disconnects it and it reconnects as needed.
 * Later on, when we can revive a full session with the snapshot of data rwad and all,
 * it add another use case where we'd had more re-connections.
 */

exports.WebSocketSessionConnection = Montage.specialize(/** @lends WebSocketSession.prototype */ {
    constructor: {
        value: function WebSocketSessionConnection() {
            this.super();
            return this;
        }
    },

    /**
     * The WebSocket connectionId that’s created and provided by AWS API Gateway
     */
    connectionId: {
        value: undefined
    },

    /**
     * The time range modeling the beginning and end of the session
     * @property {Range<Date>} value
     */
    timeRange: {
        value: undefined
    }

});
