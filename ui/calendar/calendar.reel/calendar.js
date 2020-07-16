var AbstractInspector = require("ui/controls/abstract/abstract-inspector").AbstractInspector,
    //RoutingService = require("core/service/routing-service").RoutingService,
    _ = require("lodash"),
    Criteria = require("montage/core/criteria").Criteria,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    DataQuery = require("montage/data/model/data-query").DataQuery,
    DataStream = require("montage/data/service/data-stream").DataStream;

exports.Calendar = AbstractInspector.specialize({
    _inspectorTemplateDidLoad: {
        value: function() {
            //this._routingService = RoutingService.getInstance();
        //     this.taskCategories = [
        //     { name: 'Scrub', value: 'volume.scrub', checked: true },
        //     { name: 'Replication', value: 'replication.sync', checked: true },
        //     { name: 'Smart', value: 'disk.parallel_test', checked: true },
        //     { name: 'Update', value: 'update.checkfetch', checked: true },
        //     { name: 'Command', value: 'calendar_task.command', checked: true },
        //     { name: 'Snapshot', value: 'volume.snapshot_dataset', checked: true },
        //     { name: 'Rsync', value: 'rsync.copy', checked: true }
        // ];

        //TODO: this needs to be fetched dynamically as Services





            this.addPathChangeListener('selectedObject', this, '_handleSelectionChange');
        }
    },

    _handleSelectionChange: {
        value: function(value) {
            if (value) {
                if (value._isNew) {
                    if(this.object)
                        this.object._newTask = _.cloneDeep(value);
                    //this._routingService.navigate('/calendar/calendar-task/create/' + value.task);
                } else {
                    if(this.object)
                        this.object._newTask = null;
                    //this._routingService.navigate('/calendar/calendar-task/_/' + value.id);
                }
            }
        }
    },

    enterDocument: {
        value: function () {
            var self = this;

            // return Promise.all([
            //     this._sectionService.getGmtOffset(),
            //     this.application.applicationContextService.findCurrentUser()
            // ])
            //     .spread(function(gmtOffset, user) {
            //         self.object._gmtOffset = gmtOffset.slice(0,3);
            //         self.object._firstDayOfWeek = _.get(user, 'attributes.userSettings.firstDayOfWeek', 0);
            //     });
        }
    },

    _timeRange: {
        value: null
    },

    timeRange: {
        get: function() {
            return this._timeRange;
        },
        set: function(value) {
            if (this._timeRange !== value) {
                console.log("timeRange is "+value);
                this._timeRange = value;
            }
        }
    }

});
