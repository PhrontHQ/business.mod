var Component = require("mod/ui/component").Component,
    PressComposer = require("mod/composer/press-composer").PressComposer;
    //_ = require('lodash');

exports.CalendarListItem = Component.specialize(/** @lends CalendarListItem# */ {
    schedule: {
        get: function() {
            if (this.object) {
                var result,
                    everyHour = this.object.hour == '*',
                    everyMinute = this.object.minute == '*',
                    everySecond = this.object.second == '*';
                if (everyHour || everyMinute || everySecond) {
                    this.isTextualSchedule = true;
                    if (everyHour) {
                        result = "Every hour";
                        if (everyMinute) {
                            result = "Every minute";
                            if (everySecond) {
                                result = "Every second";
                            } else {
                                result +=   " at " +
                                    this._normalizeValue(this.object.second);
                            }
                        } else {
                            result +=   " at " +
                                this._normalizeValue(this.object.minute) + ':' +
                                this._normalizeValue(this.object.second);
                        }
                    }
                } else {
                    this.isTextualSchedule = false;
                    var startDate = this.object.event.scheduledTimeRange.begin;
                    result = this._normalizeValue(startDate.hour) + ':' +
                        this._normalizeValue(startDate.minute) + ':' +
                        this._normalizeValue(startDate.second);
                }
                return result;
            }
        }
    },

    objectTitle: {
        get: function() {
            var event = this.object.event,
                organizer = event.participatingParty,
                organizerName = organizer.name,
                eventChildren = event.children,
                firstChildEvent = eventChildren && eventChildren[0],// Could be more than 1, simplify for quick test
                participant = firstChildEvent.participatingParty,
                participantName = participant.name || (`${participant.firstName} ${participant.lastName}`);

            return `${this.object.service.professionalName} - Dr ${organizerName.toString()} / ${participantName.toString()}`;
        }
    },

    enterDocument: {
        value: function (isFirstTime) {
            if (isFirstTime) {
                this.addPathChangeListener('object', this, '_handleObjectChange');
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
        value: function () {
            this.selectedTask = this.object.task;
        }
    },

    _handleObjectChange: {
        value: function(object) {
            var self = this;
            this.classList.forEach(function(className) {
                if (className.startsWith('type-')) {
                    self.classList.remove(className);
                }
            });
            if (object) {
                if(object.task && object.task.task) {
                    this.classList.add('type-' + object.task.task.replace('.', '_').toLowerCase());
                }
                this.dispatchOwnPropertyChange("schedule", this.schedule);
                this.dispatchOwnPropertyChange("objectTitle", this.objectTitle);
            }
        }
    },

    _normalizeValue: {
        value: function(value) {
            return value < 10 ? '0' + value : value;
        }
    }
});
