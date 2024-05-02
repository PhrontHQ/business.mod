var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class ColorSpace
 * @extends DataObject
 *
 * TODO: Model API  for parsers from strings, converters?
 * 	ranges per channel, use montage Range: {
		l: [0, 100],
		a: [-79.167, 93.408],
		b: [-111.859, 93.246]
	},

 *  + interpolations and diverse methods.
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

https://github.com/Evercoder/culori/blob/master/src/lab/definition.js
{
	mode: 'lab',
	output: {
		rgb: convertLabToRgb
	},
	input: {
		rgb: convertRgbToLab
	},
	channels: ['l', 'a', 'b', 'alpha'],
	ranges: {
		l: [0, 100],
		a: [-79.167, 93.408],
		b: [-111.859, 93.246]
	},
	parsers: [parseLab],
	interpolate: {
		l: interpolateLinear(),
		a: interpolateLinear(),
		b: interpolateLinear(),
		alpha: interpolateLinear(interpolateAlpha)
	}
};


 */


exports.ColorSpace = DataObject.specialize(/** @lends ColorSpace.prototype */ {

    name: {
        value: undefined
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
        value: undefined
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
        value: undefined
    },



},{
    colorType: {
        value: undefined
    },

    _registeredColorSpaceByName: {
        value: new Map()
    },
    registerColorSpace: {
        value: function(colorSpace) {
            if(colorSpace instanceof ColorSpace) {
                this._registeredColorSpaceByName.set(colorSpace.name,colorSpace);
            } else {
                throw new Error("Attempt to register a ColorSpace that isn't one "+ JSON.stringify(colorSpace));
            }
        }
    },
    withName: {
        value: function(colorSpaceName) {
            var value =  this._registeredColorSpaceByName.get(colorSpaceName);
            if(!colorSpaceName) {
                throw new Error("Unknown ColorSpace "+colorSpaceName);
            }
        }
    }
});
