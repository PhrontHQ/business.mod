var Component = require("montage/ui/component").Component;


exports.CalendarList = Component.specialize({
    _data: {
        value: null
    },

    data: {
        get: function() {
            return this._data;
        },
        set: function(object) {
            if (this._data !== object) {
                this._data = object;

                this._organizeDataByDay();
            }
        }
    },

    _organizeDataByDay: {
        value: function() {

            if(this._data && this._data.length) {
                var dayData = this.dayData,
                    data = this._data,
                    i, countI, iDay, iDayRange, iDayRangeData,
                    d=0, countD = data.length, dData;

                /*
                    We assume data is sorted chronologicallly using the expression off objects in data that are the time ranges.
                */

                for(i=0, countI = dayData.length; (i<countI); i++) {
                    iDay = dayData[i];
                    iDayRange = iDay.dayRange;
                    iDayRangeData = iDay.data;

                    while((dData = data[d++]) && iDayRange.contains(dData.event.scheduledTimeRange.begin)) {
                        iDayRangeData.push(dData);
                    }
                }
            }
        }
    },

    _timeRange: {
        value: null
    },

    timeRange: {
        get: function() {
            return this._timeRange;
        },
        set: function(object) {
            if (!this._timeRange || (this._timeRange && !this._timeRange.equals(object))) {
                this._timeRange = object;
                this.dayData = null;
            }
        }
    },

    _dayData: {
        value: null
    },

    _buildDayData: {
        value: function() {
            if(this._timeRange && !this._dayData) {
                var fullDayIterator = this.timeRange.fullDayIterator(),
                    dayData,
                    iFullDayRange,
                    iDayData;

                while(iFullDayRange = fullDayIterator.next().value) {
                    iDayData = {
                        dayRange: iFullDayRange,
                        data: []
                    };

                    (dayData || (dayData = [])).push(iDayData);
                }

                this._dayData = dayData;
            }
        }
    },

    /*
        dayData organizes data by day. There could be no data for a day, so we're building it off the timeRange we have.

        "days": {
            "prototype": "montage/ui/repetition.reel",
            "properties": {
                "element": {"#": "days"}
            },
            "bindings": {
                "content": {"<-": "@owner.data.group{event.scheduledTimeRange.begin.defaultStringDescription}"}
            }
        },

    */
    dayData: {
        get: function() {
            if(!this._dayData) {
                this._buildDayData();
            }
            return this._dayData;
        },
        set: function(object) {
            if (this._dayData !== object) {
                this._dayData = object;
            }
        }
    },

    // dataGroupedByDay:


});
