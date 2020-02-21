/**
 * @module phront/data/converter/timestamp-with-timezone-range-string-to-date-range-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("montage/core/converter/converter").Converter,
    Range = require("montage/core/range"),
    singleton;

/**
 * @class TimestampWithTimezoneRangeStringToDateRangeConverter
 * @classdesc Converts an RFC3339 UTC string to a date and reverts it.
 */
var TimestampWithTimezoneRangeStringToDateRangeConverter = exports.TimestampWithTimezoneRangeStringToDateRangeConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === TimestampWithTimezoneRangeStringToDateRangeConverter) {
                if (!singleton) {
                    singleton = this;
                }

                return singleton;
            }

            return this;
        }
    },

    /**
     * Converts the RFC3339 string to a Date.
     * @function
     * @param {string} v The string to convert.
     * @returns {Range} The Date converted from the string.
     */
    convert: {
        value: function (v) {
            return Range.parse(v,Date.parseRFC3339);
        //return  Date.parseRFC3339(v);
        }
    },

    /**
     * Reverts the specified Date to an RFC3339 String.
     * @function
     * @param {Range} v The specified string.
     * @returns {string}
     */
    revert: {
        value: function (v) {
            //Wish we could just called toString() on v,
            //but it's missing the abillity to cutomize the
            //stringify of begin/end
            return v.bounds[0] + v.begin.toISOString() + "," + v.end.toISOString()+ v.bounds[1]

            return v.toISOString();
        }
    }

});

Object.defineProperty(exports, 'singleton', {
    get: function () {
        if (!singleton) {
            singleton = new TimestampWithTimezoneRangeStringToDateRangeConverter();
        }

        return singleton;
    }
});
