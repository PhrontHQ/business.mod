/**
 * @module ui/calendar/calendar.mod/calendar-list.reel/group-array-by-day-range-converter
 * @requires montage/core/converter/converter
 */
var Converter = require("montage/core/converter/converter").Converter,
    CalendarDate = require("montage/core/date/calendar-date").CalendarDate,
    Range = require("montage/core/range").Range;

require("montage/core/collections/shim-array");


/**
 * @class GroupArrayByDayRangeConverter
 * @classdesc Converts an RFC3339 UTC string to a date and reverts it.
 */
var GroupArrayByDayRangeConverter = exports.GroupArrayByDayRangeConverter = Converter.specialize({

    sortCompareFunction: {
        value: function compare(a, b) {

            return Range.compareBeginToBegin(a.event.scheduledTimeRange,b.event.scheduledTimeRange);
        // if (a is less than b by some ordering criterion) {
        //   return -1;
        // }
        // if (a is greater than b by the ordering criterion) {
        //   return 1;
        // }
        // // a must be equal to b
        // return 0;
      }

    },
    /**
     * Converts an array of objects that have date/timeTange (with as a given expression)
     * to an array of objects like:
     * {
     *  dayRange: - a TimeRange representing a fullDay
     *  data: objects whose expresssion returning a date/range is contained in that day
     * }
     * @function
     * @param {Array} v The array to group.
     * @returns {Array} The Arrat grouping data by day range
     */
    convert: {
        value: function (v) {
            if(v.length) {
                //Make sure they're ordered first
                v.sort(this.sortCompareFunction);
                var result = [],
                    i, countI, iBegin,
                    iDayStructure;
                //Now loop
                for(i=0, countI = v.length;(i<countI); i++) {
                    iBegin = v[i].event.scheduledTimeRange.begin;

                    iDayStructure = {
                        dayRange: iBegin.fullDayRange,
                        data: []
                    };

                    while(v[++i].event.scheduledTimeRange.begin)


                }
            } else {
                return Array.empty;
            }
        }
    }

});
