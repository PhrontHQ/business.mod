var ColorSpace = require("./color-space").ColorSpace;

/**
 * @class ColorSpace
 * @extends DataObject
 */

 /*
    From Culori:

    https://github.com/Evercoder/culori/blob/master/src/rgb/definition.js
{
	mode: 'rgb',
	channels: ['r', 'g', 'b', 'alpha'],
	parsers: [parseHex, parseRgb, parseNamed, parseTransparent],
	interpolate: {
		r: interpolateLinear(),
		g: interpolateLinear(),
		b: interpolateLinear(),
		alpha: interpolateLinear(interpolateAlpha)
	}
};

 */

var _RGBColorSpace,
    RGBColorSpace = exports.RGBColorSpace = ColorSpace.specialize(/** @lends ColorSpace.prototype */ {
    constructor: {
        value: function() {
            if (this.constructor === RGBColorSpace) {
                if (!_RGBColorSpace) {
                    _RGBColorSpace = this;
                }
                return _RGBColorSpace;
            }

            return this;
        }
    },

    name: {
        value: "rgb"
    },

    /**
     * Converts the color from it's colorSpace into anotherColorSpace.
     *
     * @param {Color} color     The color to convert
     * @return {Color}          The same color object converted into space
     */
    convertColor: {
        value: function(color) {
            console.error("Immplementation missing");
            return this;
        }
    },

    /**
     * Create a new color from the color argument, converted into the receiver space.
     *
     * @param {ColorSpace} anotherColorSpace     The colorSpace to convert into
     * @return {CalendarDate}                   The converted calendarDate object
     */
    colorByConvertingColor: {
        value: function(color) {
            console.error("Immplementation missing");
            return this;
        }
    },

    /**
     * An array containing the names of the channels in the colorSpace.
     * The order is expected to match Color's channels data in that color space.
     *
     * for example ["red","green","blue","alpha"]
     *
     * @property {array} value
     */
    channels: {
        value: ['red', 'green', 'blue', 'alpha']
    },

    /**
     * An array containing the commonly abbreviated names of the colorSpace channels.
     * The order is expected to match Color's channels data in that color space.
     *
     * for example ["r","g","b","a"]
     *
     * @property {array} value
     */
    abbreviatedChannels: {
        value: ['r', 'g', 'b', 'alpha']
    }

});

ColorSpace.registerColorSpace(new RGBColorSpace);
