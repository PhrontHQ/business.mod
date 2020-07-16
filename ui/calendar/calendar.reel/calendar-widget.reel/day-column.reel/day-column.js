// var AbstractDropZoneComponent = require("core/drag-drop/abstract-dropzone-component").AbstractDropZoneComponent;
var Component = require("montage/ui/component").Component;

//exports.DayColumn = AbstractDropZoneComponent.specialize({
exports.DayColumn = Component.specialize({

    _data: {
        value: false
    },


    data: {
        set: function (value) {
            if (this._data !== value) {
                this._data = value;
            }
        },
        get: function () {
            return this._data;
        }
    },


    droppable: {
        value: true
    },

    enterDocument: {
        value: function (firstTime) {
            this.application.addEventListener("dragstart", this, false);
            this.application.addEventListener("dragover", this, false);
        }
    },
    exitDocument: {
        value: function () {
            this.application.removeEventListener("dragstart", this, false);
            this.application.removeEventListener("dragover", this, false);
        }
    },

    templateDidLoad: {
        value: function() {
            this.super();
            this._calendarService = this.application.calendarService;
        }
    },
    handleDragstart: {
        value: function (event) {
            console.log("DayColumn: handleDragstart",event.dataTransfer.types);
            /*
                TaskCategory / Service needs to add a relevant type to dataTransfer.types
                and the dagged
                Right now, we can get
            */
            var draggedObject = event.dataTransfer.draggedObject,
                draggedObjectDescriptor = draggedObject.objectDescriptor,
                shouldAccept = this.taskCategories.has(draggedObject);
                // shouldAccept = !!(event.dataTransfer.types &&
                // event.dataTransfer.types.indexOf('Files') > -1);

                if (shouldAccept) {
                    event.dataTransfer.dropTargetCandidates.add(this);
                    this._addEventListeners();
                    this.willAcceptDrop = true;
                }

        }
    },

    handleDragover: {
        value: function (event) {
            console.log("DayColumn: handleDragover",event);

            var dataTransfer = event.dataTransfer;

            // if (!this._acceptDrop) {
                if (this.willAcceptDrop) {
                    event.preventDefault();

                    dataTransfer.dropEffect = dataTransfer.effectAllowed;
                    this.acceptDrop = true;

                    this._element.addEventListener("dragleave", this, false);
                    this._element.addEventListener("drop", this, false);
                } else {
                    dataTransfer.dropEffect = "none";
                }
            // } else { // Component is already accepting drop.
            //     event.preventDefault();

            // }
        }
    },

    // handleComponentDrop: {
    //     value: function(event) {
    handleDrop: {
        value: function (event) {
            console.log("DayColumn: handleDrop",event);

            var self = this,
            taskCategoryComponent = event.target;
            console.log("Should create new task matching drop");

            var newTask = {};
            Object.assign(newTask,event.dataTransfer.draggedObject);
            newTask._isNew = true;
            self.selectedTask = newTask;
            // this._calendarService.getNewTask(this._getDateFromEvent(event), taskCategoryComponent.object.value).then(function(task) {
            //     self.selectedTask = task;
            // });
        }
    },

    handleDragended: {
        value: function () {
            this._clearPreviousOverMultipleSelectValueIfNeeded();
            this._removeEventListeners();
        }
    },

    _addEventListeners: {
        value: function () {
            this.addEventListener("dragended", this);
            this.addEventListener("drop", this);
        }
    },

    _removeEventListeners: {
        value: function () {
            this.removeEventListener("dragended", this);
            this.removeEventListener("drop", this);
        }
    },


    _getDateFromEvent: {
        value: function(event) {
            var self = this,
                date = new Date(this.data.rawDate),
                targetBoundingRect = this.element.getBoundingClientRect(),
                dropPosition = this._getDropPosition(event),
                timeInMinutes = (dropPosition.y - targetBoundingRect.top) / targetBoundingRect.height * 1440;
            date.setHours(Math.floor(timeInMinutes / 60));
            date.setMinutes(timeInMinutes % 60);
            return date;
        }
    },

    _getDropPosition: {
        value: function(event) {
            var targetBoundingRect = event.target.element.getBoundingClientRect();
            return {
                x: event.translateX + targetBoundingRect.left,
                y: event.translateY + targetBoundingRect.top
            };
        }
    }
});
