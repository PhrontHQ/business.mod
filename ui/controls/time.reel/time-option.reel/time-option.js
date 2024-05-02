/**
 * @module ui/time-option.reel
 */
var Component = require("mod/ui/component").Component,
    PressComposer = require("mod/composer/press-composer").PressComposer;

/**
 * @class TimeOption
 * @extends Component
 */
exports.TimeOption = Component.specialize(/** @lends TimeOption# */ {
    prepareForActivationEvents: {
        value: function() {
            var pressComposer = new PressComposer();
            this.addComposer(pressComposer);
            pressComposer.addEventListener("press", this);
            this.element.addEventListener("mouseover", this);
        }
    },

    handlePress: {
        value: function() {
            this.selected = this.option;
        }
    }
});
