var Component = require("montage/ui/component").Component;

exports.Section = Component.specialize({

    constructor: {
        value: function Section() {}
    },

    title: {
        value: undefined
    }

});