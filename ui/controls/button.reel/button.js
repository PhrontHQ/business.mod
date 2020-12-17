var Button = require("montage/ui/button.reel").Button;

/**
 * @class Button
 * @extends Component
 */
var Button = exports.Button = Button.specialize({
    constructor: {
        value: function Button() {
            //To counter a change in montage
            this.label = "";
            return this;
        }
    },

    hasTemplate: {
        value: true
    }
});


