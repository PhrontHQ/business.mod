//var AbstractDraggableComponent = require("core/drag-drop/abstract-draggable-component").AbstractDraggableComponent;
var Component = require("mod/ui/component").Component;


//exports.TaskCategory = AbstractDraggableComponent.specialize({
exports.TaskCategory = Component.specialize({
    draggable: {
        value: true
    },
    enterDocument: {
        value: function () {
            if(this.object && this.object.value) {
                this.classList.add('type-' + this.object.value.replace('.', '_'));
            }
        }
    },
    prepareForActivationEvents: {
        value: function() {
            this.addEventListener("dragstart", this, false);
        }
    },
    exitDocument: {
        value: function () {
            this.removeEventListener("dragstart", this, false);
        }
    },
    handleDragstart: {
        value: function (event) {
            event.dataTransfer.draggedObject = this.object;
        }
    }
});
