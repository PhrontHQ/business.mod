var Component = require("montage/ui/component").Component;

exports.Service = Component.specialize({

    constructor: {
        value: function Service() {}
    },

    image: {
        get: function () {
            return this._image;
        },
        set: function (value) {
            if (this._image !== value) {
                this._image = value;
                this.needsDraw = true;
            }
        }
    },

    description: {
        get: function () {
            return this._description;
        },
        set: function (value) {
            if (this._description !== value) {
                this._description = value;
                this.needsDraw = true;
            }
        }
    },

    draw: {
        value: function () {
            if (this._image) {
                this.backgroundImageElement.style.backgroundImage = "url(" + this._image + ")";
                this.imageElement.style.backgroundImage = "url(" + this._image + ")";
            }
            if (this._description) {
                this.descriptionElement.innerHTML = this._description;
            }
        }
    }

});