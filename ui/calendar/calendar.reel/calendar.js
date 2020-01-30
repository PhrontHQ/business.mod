var AbstractInspector = require("ui/controls/abstract/abstract-inspector").AbstractInspector,
    //RoutingService = require("core/service/routing-service").RoutingService,
    _ = require("lodash");

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

            this.taskCategories = [
                { name: "Surveillance Médicale Ordinaire - 20mn", value: "volume.scrub", checked: true },
                { name: "Visite de Reprise - 40mn", value: "volume.snapshot_dataset", checked: true },
                { name: "Surveillance Médicale Renforcée - 60mn", value: "rsync.copy", checked: true }
            ];
            this.addPathChangeListener('selectedObject', this, '_handleSelectionChange');
        }
    },

    _handleSelectionChange: {
        value: function(value) {
            if (value) {
                if (value._isNew) {
                    this.object._newTask = _.cloneDeep(value);
                    //this._routingService.navigate('/calendar/calendar-task/create/' + value.task);
                } else {
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
    }
});
