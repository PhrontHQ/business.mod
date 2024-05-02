/**
 * @module ui/day-cell.reel
 */
var Component = require("mod/ui/component").Component,
    PressComposer = require("mod/composer/press-composer").PressComposer;

/**
 * @class DayCell
 * @extends Component
 */
exports.DayCell = Component.specialize(/** @lends DayCell# */ {
    
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
            this.currentSelection = this.value;
        }
    }

});
