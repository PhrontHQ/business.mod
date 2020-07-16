/**
 * @module ui/event.reel
 */
var Component = require("montage/ui/component").Component,
    PressComposer = require("montage/composer/press-composer").PressComposer;

/**
 * @class Event
 * @extends Component
 */
exports.CalendarEvent = Component.specialize(/** @lends Event# */ {

    _object: {
        value: null
    },
    object: {
        set: function (value) {
            if (this._object !== value) {
                this._object = value;
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._object;
        }
    },

    titleExpression: {
        value: "summary"
    },

    enterDocument: {
        value: function(isFirstTime) {
            if(this.object && this.object.task) {
                /*
                    this is a hook to apply styling for a type of task, which are defined and declared in calendar-widget.css

                    .CalendarWidget-event.type-replication_sync .CalendarWidget-event-inner {
                        background-color: #7b1fa2
                    }
                */
                if(this.object.task) {
                    this.classList.add('type-' + this.object.task.task.replace('.', '_').toLowerCase());
                }
            }
        }
    },

    didDraw: {
        value: function () {
            this._setPosition();
            //var color = this.object.color || (this.object.calendar && this.object.calendar.color);
            var color = "red";
            if(color) {
                //CalendarWidget-event-inner
                this.element.style.setProperty( "background-color", color );
                //this.element.firstElementChild.style.setProperty( "background-color", color );
            }
        }
    },

    exitDocument: {
        value: function() {
            if(this.object && this.object.task) {
                this.classList.remove('type-' + this.object.task.task.replace('.', '_').toLowerCase());
            }
        }
    },

    prepareForActivationEvents: {
        value: function() {
            var pressComposer = new PressComposer();
            this.addComposer(pressComposer);
            pressComposer.addEventListener("press", this);
            this.element.addEventListener("mouseover", this);
        }
    },

    handlePress: {
        value: function(event) {
            this.selectedTask = this.object.task;
        }
    },

    _resetStyle: {
        value: function() {
            this.element.style.position = '';
            this.element.style.top = '';
        }
    },

    __hourHeightValue: {
        value: undefined
    },
    __hourHeightUnit: {
        value: undefined
    },
    _parseHourHeight: {
        value: function() {
            var hourHeight = window.getComputedStyle(this.element).getPropertyValue("--hourHeight"),
            value = parseInt(hourHeight),
            unit = hourHeight.substring(hourHeight.lastIndexOf(value)+1);

            this.constructor.prototype.__hourHeightValue = value;
            this.constructor.prototype.__hourHeightUnit = unit;
        }
    },
    _hourHeightValue: {
        get: function() {
            if(!this.__hourHeightValue) {
                this._parseHourHeight();
            }
            return this.__hourHeightValue;
        }
    },
    _hourHeightUnit: {
        get: function() {
            if(!this.__hourHeightUnit) {
                this._parseHourHeight();
            }
            return this.__hourHeightUnit;
        }
    },

    _setPosition: {
        value: function() {
            if(!this.object.isAllDay) {
                this._resetStyle();
                // multiply by height row (3) to get top position
                // $FIXME - this value (3) shouldn't be hard coded

                this.element.style.top = this._setY(this.object.timeRange.begin.hour, this.object.timeRange.begin.minute) * this._hourHeightValue + this._hourHeightUnit;

                var duration = this._setHeight(this.object.timeRange.length);
                console.log("Event duration: "+duration);
                this.element.style.height =  duration * this._hourHeightValue + this._hourHeightUnit;

                // if event has concurrent events
                if(this.object.concurrentIndex > 0) {
                    this.classList.add('event-is-overlayed');
                    this.element.style.left = (100 / (this.object.concurrentEvents) * this.object.concurrentIndex) + "%";
                }
            }
        }
    },

    _setY: {
        value: function(hours, minutes) {
            var hours   = parseInt(hours);
            var minutes = parseInt(minutes);
            if(minutes) {
                // convert minutes into percentage and set correct decimal placement
                minutes = minutes * (100/60) * .01;
                return hours + minutes;
            } else {
                return hours;
            }
        }
    },
    /*
        needs to return value in hours
    */
    _setHeight: {
        value: function(length /*in milliseconds*/) {
            return length / 1000 / 60 /60;
        }
    }

});
