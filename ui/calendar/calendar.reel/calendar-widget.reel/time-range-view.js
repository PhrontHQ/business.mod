var Component = require("mod/ui/component").Component;



/**
 * @class TimeRangeView
 * @extends Component
 */
exports.TimeRangeView = Component.specialize({

    /**
     * the range of time handled by the view.
     *
     * @type {Range}
     * @default null
     */

    timeRange: {
        value: null
    },

    _data: {
        value: false
    },
    data: {
        set: function (value) {
            if (this._data !== value) {
                this._data = value;
            }
        },
        get: function () {
            return this._data;
        }
    }


});
