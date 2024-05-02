var Component = require("mod/ui/component").Component,
    PressComposer = require("mod/composer/press-composer").PressComposer;

/**
 * @class RadioButtonField
 * @extends Component
 */
exports.RadioButtonField = Component.specialize({
    constructor: {
        value: function RadioButtonField () {
            return this;
        }
    },
    prepareForActivationEvents: {
        value: function() {
            this._pressComposer = new PressComposer();
            this.addComposerForElement(this._pressComposer, this.labelElement);
            this._pressComposer.addEventListener("press", this, false);
        }
    },
    _pressComposer: {
        value: null
    },

    handlePress: {
        value: function() {
            var radioButton = this.templateObjects.radioButton;

            if (!radioButton.checked) {
                radioButton.checked = true;
            }
        }
    }
});
