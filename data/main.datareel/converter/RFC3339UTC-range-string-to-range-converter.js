/**
 * @module montage/core/converter/RFC3339UTC-range-string-to-range-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("montage/core/converter/converter").Converter,
    Range = require("montage/core/range").Range,
    singleton;

    //ISO 8601

    //for Date.parseRFC3339
    require("montage/core/extras/date");

 // Parse string like '2019-09-12 09:52:52.992823+00'
// to a date
// Assumes string is always +00
function _PG_ISO_8601_DateParse(s) {
    var b = s.split(/\D/),
        hasQuotePadding =  (b[0] === "" && b[b.length-1] === ""),
        yearIndex, monthIndex, dayIndex, hourIndex, minuteIndex, secondIndex, millisecondIndex;

    if(hasQuotePadding) {
        yearIndex = 1;
        monthIndex = 2;
        dayIndex = 3;
        hourIndex = 4;
        minuteIndex = 5;
        secondIndex = 6;
        millisecondIndex = 7;
    } else {
        yearIndex = 0;
        monthIndex = 1;
        dayIndex = 2;
        hourIndex = 3;
        minuteIndex = 4;
        secondIndex = 5;
        millisecondIndex = 6;
    }

    --b[monthIndex];                  // Adjust month number, 0 based in Date.UTC()
    b[millisecondIndex] = b[millisecondIndex].substr(0,3); // Microseconds to milliseconds
    return new Date(Date.UTC(b[yearIndex], b[monthIndex], b[dayIndex], b[hourIndex], b[minuteIndex], b[secondIndex], b[millisecondIndex]));
  }


/**
 * @class RFC3339UTCRangeStringToRangeConverter
 * @classdesc Converts an RFC3339 UTC string to a date and reverts it.
 */
var RFC3339UTCRangeStringToRangeConverter = exports.RFC3339UTCRangeStringToRangeConverter = Converter.specialize({

    constructor: {
        value: function () {
            if (this.constructor === RFC3339UTCRangeStringToRangeConverter) {
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
            if(typeof v === "string") {
                return Range.parse(v,_PG_ISO_8601_DateParse);
                //return Range.parse(v,Date.parseRFC3339);
            } else {
                return v;
            }
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
            singleton = new RFC3339UTCRangeStringToRangeConverter();
        }

        return singleton;
    }
});
