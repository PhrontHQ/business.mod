var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
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
 * @class Day
 * @extends Component
 */
exports.DayView = Component.specialize({
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

    _daysOfWeek: {
        value: [
                "Sun",
                "Mon",
                "Tues",
                "Wed",
                "Thurs",
                "Fri",
                "Sat"
            ]
    },

    //Benoit: Explore use of Intl to get localized day names

    /*

        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat

        weekday
        The representation of the weekday. Possible values are:
        "long" (e.g., Thursday)
        "short" (e.g., Thu)
        "narrow" (e.g., T). Two weekdays may have the same narrow style for some locales (e.g. Tuesday's narrow style is also T).


        var date = new Date(0);
        date.setDate(4 + day);
        for (var i = 0; i < 7; i++) {
        var weekday = new Intl.DateTimeFormat(["en"], {
            weekday: "short" // ?? what should I put here
        }).format(date);
        console.log(weekday);
        }
    */

    // __daysOfWeek: {
    //     value: undefined
    // },
    // _daysOfWeek: {
    //     get: function() {
    //         if(!this.__daysOfWeek) {
    //             var daysOfWeek = this.__daysOfWeek = [];
    //             for (var day = 5; day <= 11; day++) {
    //                 daysOfWeek.push(new Date(1970, 1 - 1, day).toLocaleString('fr', { weekday: 'short' /* or 'long' */ }));
    //             }
    //         }
    //         return this.__daysOfWeek;
    //     }
    // },

    enterDocument: {
        value: function (isFirstTime) {
            this.gotoToday();
        }
    },

    gotoPrevious: {
        value: function() {
            this._today.setDate(this._today.getDate()-1);
            this._updateCalendar();
        }
    },

    gotoToday: {
        value: function() {
            var today = new Date();
            today.setDate(today.getDate());
            this._today = today;
            this._updateCalendar();
        }
    },

    gotoNext: {
        value: function() {
            this._today.setDate(this._today.getDate()+1);
            this._updateCalendar();
        }
    },

    _updateCalendar: {
        value: function() {
            var self = this,
                year = this._today.getFullYear(),
                month = this._today.getMonth(),
                date = this._today.getDate(),
                today = new Date(),
                dayDate = new Date(year, month, date),
                displayedDay = {
                    year:   dayDate.getFullYear(),
                    month:  dayDate.getMonth(),
                    date:   dayDate.getDate(),
                    rawDate: dayDate,
                    day: dayDate.getDay(),
                    isToday:
                        (dayDate.getDate() === today.getDate()) &&
                        (dayDate.getFullYear() === today.getFullYear()) &&
                        (dayDate.getMonth() === today.getMonth())
                };
            console.error("Needs Mock tasks");
            if(this.application.sectionService) {
                this.application.sectionService.getTasksScheduleOnDay(displayedDay).then(function(tasks){
                    displayedDay.events = tasks;
                });
            }
            else {
                displayedDay.events = [{
                    name: "A",
                    hour: 8,
                    minute: 0,
                    second:0,
                    task: {
                        task: "Task-A"
                    }
                },
                {
                    name: "B",
                    hour: 10,
                    minute: 0,
                    second:0,
                    task: {
                        task: "Task-B"
                    }
                },
                {
                    name: "C",
                    hour: 12,
                    minute: 0,
                    second:0,
                    task: {
                        task: "Task-C"
                    }
                },
                {
                    name: "D",
                    hour: 14,
                    minute: 0,
                    second:0,
                    task: {
                        task: "Task-D"
                    }
                },
                {
                    name: "E",
                    hour: 16,
                    minute: 0,
                    second:0,
                    task: {
                        task: "Task-E"
                    }
                }];
            }
            this.displayedDay = displayedDay;
            this.displayedPeriodLabel = [
                this._daysOfWeek[displayedDay.day] + ',',
                this._months[displayedDay.month],
                displayedDay.date + ',',
                displayedDay.year
            ].join(' ');
            this.days = [this.displayedDay];
        }
    }
});
