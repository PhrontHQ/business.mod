/**
 * @module ui/calendar-list-day.reel
 */
var Component = require("montage/ui/component").Component,
    Locale = require("montage/core/locale").Locale,
    monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * @class CalendarListDay
 * @extends Component
 */
exports.CalendarListDay = Component.specialize(/** @lends CalendarListDay# */ {
    events: {
        value: null
    },

    /*
formatter = Intl.DateTimeFormat(
    "en-US", {weekday:"long", day: "numeric", month: "long" })
*/

    _dayDateFormatter: {
        value: undefined
    },
    dayDateFormatter: {
        get: function() {
            if(!this._dayDateFormatter) {
                this._dayDateFormatter = Intl.DateTimeFormat(
                    Locale.systemLocale.identifier, {
                        weekday: "long",
                        day: "numeric",
                        month: "long"
                    });
            }
            return this._dayDateFormatter;
        }
    },

    _object: {
        value: null
    },

    object: {
        get: function() {
            return this._object;
        },
        set: function(object) {
            if (this._object !== object) {
                this._object = object;
                if (object) {
                    this.events = object.data;
                    this.fullDate = this.dayDateFormatter.format(object.dayRange.begin);
                    //this._loadTasks();
                }
            }
        }
    },

    _selectedDay: {
        value: null
    },

    selectedDay: {
        get: function() {
            return this._selectedDay;
        },
        set: function(selectedDay) {
            if (this._selectedDay !== selectedDay) {
                this._selectedDay = selectedDay;
                if (selectedDay == this._object) {
                    this.element.scrollIntoView();
                }
            }
        }
    },

    _setHasEvents: {
        value: function() {
            if (this.object) {
                this.object._hasEvents = this.displayedEvents && !!this.displayedEvents.length;
            }
        }
    },

    enterDocument: {
        value: function(isFirstTime) {
            if (isFirstTime) {
                this.addRangeAtPathChangeListener("displayedEvents", this, "_setHasEvents");
            }
            //this._loadTasks();
        }
    },


    _loadTasks: {
        value: function() {
            if (this._object) {
                var self = this;
                console.error("Needs Mock tasks");
                self.events = [{
                    name: "F",
                    task: {
                        task: "Task-F",
                        name: "Task-F-name"
                    },
                    hour:"1",
                    minute:"0",
                    second:"0"
                },
                {
                    name: "G",
                    task: {
                        task: "Task-G",
                        name: "Task-G-name"
                    },
                    hour:"2",
                    minute:"0",
                    second:"0"
               },
                {
                    name: "H",
                    task: {
                        task: "Task-H",
                        name: "Task-H-name"
                    },
                    hour:"3",
                    minute:"0",
                    second:"0"
            },
                {
                    name: "I",
                    task: {
                        task: "Task-I",
                        name: "Task-I-name"
                    },
                    hour:"4",
                    minute:"0",
                    second:"0"
          },
                {
                    name: "J",
                    task: {
                        task: "Task-J",
                        name: "Task-J-name"
                    },
                    hour:"5",
                    minute:"0",
                    second:"0"
              }];
                // this.application.sectionService.getTasksScheduleOnDay(this._object).then(function(tasks) {
                //     self.events = tasks;
                // });
            }
        }
    }
});
