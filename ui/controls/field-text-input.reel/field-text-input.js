var Component = require("mod/ui/component").Component;

exports.FieldTextInput = Component.specialize({
    hasTemplate: {
        value: true
    },

    disabled: {
        value: false
    },

    hasError: {
        value: false
    }
});
