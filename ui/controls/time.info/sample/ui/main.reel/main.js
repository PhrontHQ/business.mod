/**
 * @module ui/main.reel
 */
var Component = require("mod/ui/component").Component;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {
    date: {
        value: new Date()
    }
});
