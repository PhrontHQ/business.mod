var Component = require("mod/ui/component").Component,
    Promise = require("mod/core/promise").Promise,
    Range = require("mod/core/range").Range,
    MONTHS = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

/**
 * @class Week
 * @extends Component
 */
exports.WeekView = Component.specialize({

    _firstDayOfWeek: {
        value: null
    },

    firstDayOfWeek: {
        get: function() {
            return this._firstDayOfWeek;
        },
        set: function(firstDayOfWeek) {
            if (this._firstDayOfWeek !== firstDayOfWeek) {
                this._firstDayOfWeek = firstDayOfWeek;
                if (firstDayOfWeek) {
                    this.gotoToday();
                }
            }
        }
    },

    _monthsCache: {
        value: null
    },

    _months: {
        get: function() {
            if (!this._monthsCache) {
                this._monthsCache = MONTHS.map(function(x) {
                    return x.substr(0, 3);
                });
            }
            return this._monthsCache;
        }
    },

    enterDocument: {
        value: function () {
            this.gotoToday();
        }
    },

    gotoPrevious: {
        value: function() {
            this._currentPeriod.setDate(this._currentPeriod.getDate()-7);
            this._updateCalendar();
        }
    },

    gotoToday: {
        value: function() {
            var currentPeriod = new Date(),
                //The getDay() method returns the day of the week for the specified date according to local time, where 0 represents Sunday.
                currentPeriodDayOfWeek = currentPeriod.getDay(),
                //The getDate() method returns the day of the month for the specified date according to local time.
                currentPeriodDayOfMonth = currentPeriod.getDate(),
                dayOfWeek = (currentPeriodDayOfWeek + 7 - (this.firstDayOfWeek || 0)) % 7,
                //dayToLastOfWeek = 7 - (currentPeriodDayOfWeek+ (this.firstDayOfWeek || 0)) % 7,
                dayToLastOfWeek = ((7 - (this.firstDayOfWeek || 0)) - currentPeriodDayOfWeek - 1) % 7;

            currentPeriod.setDate(currentPeriodDayOfMonth - dayOfWeek);
            currentPeriod.setHours(0,0,0,0);

            /*
                //Set timeRange:
                var lastDateOfWeek = new Date(currentPeriod.getFullYear(), currentPeriod.getMonth(), currentPeriodDayOfMonth+dayToLastOfWeek);
                lastDateOfWeek.setHours(23,59,59,999);
                this.timeRange = new Range(currentPeriod,lastDateOfWeek);
            */

            this._currentPeriod = currentPeriod;
            this._updateCalendar();
        }
    },

    gotoNext: {
        value: function() {
            this._currentPeriod.setDate(this._currentPeriod.getDate()+7);
            this._updateCalendar();
        }
    },

    _updateCalendar: {
        value: function() {
            var self = this,
                year = this._currentPeriod.getFullYear(),
                month = this._currentPeriod.getMonth(),
                date = this._currentPeriod.getDate(),
                today = new Date(),
                dayDate,
                days = [],
                currentPeriodDayOfWeek = this._currentPeriod.getDay(),
                currentPeriodDayOfMonth = this._currentPeriod.getDate(),
                dayToLastOfWeek = ((7 - (this.firstDayOfWeek || 0)) - currentPeriodDayOfWeek - 1) % 7;

                //Set timeRange:
                var lastDateOfWeek = new Date(this._currentPeriod.getFullYear(), this._currentPeriod.getMonth(), currentPeriodDayOfMonth+dayToLastOfWeek);
                lastDateOfWeek.setHours(23,59,59,999);
                this.timeRange = new Range(this._currentPeriod,lastDateOfWeek);

            for (var i = 0; i < 7; i++) {
                dayDate = new Date(year, month, date + i);
                days.push({
                    year: dayDate.getFullYear(),
                    month: dayDate.getMonth(),
                    date: dayDate.getDate(),
                    day: dayDate.getDay(),
                    isCurrentMonth: dayDate.getMonth() === month,
                    isToday:
                        (dayDate.getDate() === today.getDate()) &&
                        (dayDate.getFullYear() === today.getFullYear()) &&
                        (dayDate.getMonth() === today.getMonth()),
                    rawDate: dayDate
                });
            }
            // Promise.each(days, function(day) {
            //     console.error("Needs Mock tasks");
            //     return Promise.resolve([]);
            //     // return self.application.sectionService.getTasksScheduleOnDay(day).then(function(tasks) {
            //     //     day.events = tasks;
            //     // });
            // });
            this.days = days;
            this.displayedPeriodLabel = this._getDisplayedLabel();
        }
    },

    _getDisplayedLabel: {
        value: function() {
            var first = this.days[0],
                last = this.days[6],
                result;
            if (first.year != last.year) {
                result = [
                    this._months[first.month],
                    first.date + ',',
                    first.year,
                    '-',
                    this._months[last.month],
                    last.date + ',',
                    last.year
                ];
            } else if (first.month != last.month) {
                result = [
                    this._months[first.month],
                    first.date,
                    '-',
                    this._months[last.month],
                    last.date + ',',
                    last.year
                ];
            } else {
                result = [
                    this._months[first.month],
                    first.date,
                    '-',
                    last.date + ',',
                    last.year
                ];
            }
            return result.join(' ');
        }
    }
});
