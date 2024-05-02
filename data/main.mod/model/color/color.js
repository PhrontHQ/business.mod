var DataObject = require("mod/data/model/data-object").DataObject,
    ColorSpace = require("./color-space").ColorSpace;

/**
 * @class Color
 * @extends DataObject
 * @classdesc Represents a color (point) in a colorSpace. By default saved in lab colorSpace.
 *
 */


exports.Color = DataObject.specialize(/** @lends Color.prototype */ {
    constructor: {
        //support a signature like (colorSpace, channel1, channel2, channel3, channel4, name)
        //or (colorSpace, [channel1, channel2, channel3, channel4], name)
        value: function(colorSpace, channelValues, name) {
            if(arguments.length) {
                return Array.isArray(channelValues) ? this.initWithColorSpaceChannelValues(colorSpace, channelValues, name) : this.initWithColorSpaceChannelValues(colorSpace, arguments[1], arguments[2],arguments[3],arguments[4],arguments[5]);
            }
            return this;
        }
    },
    /**
     * Returns a new  Color in colorSpace.
     *
     * @function
     * @param {Date} aDate The date for which to perform the calculation.
     * @returns {CalendarDate} true if the given date matches the given components,
     * otherwise false.
     */

    initWithColorSpaceChannelValues: {
        //support a signature like (colorSpace, channel1, channel2, channel3, channel4, name)
        //or (colorSpace, [channel1, channel2, channel3, channel4], name)
        value: function(colorSpace, channelValues, name) {
            var _colorSpace = colorSpace instanceof ColorSpace ? colorSpace : ColorSpace.withName(colorSpace),
            abbreviatedChannels = _colorSpace.abbreviatedChannels,
            isArrayChannelValues = Array.isArray(channelValues),
            maybeName = arguments[arguments.length - 1];

            this.colorSpace = _colorSpace;

            for(var i = 0, iChannel, iValue, countI = abbreviatedChannels.length; (i<countI); i++) {
                iChannel = abbreviatedChannels[i];

                if(isArrayChannelValues) {
                    iValue = channelValues[i];
                } else {
                    iValue = arguments[1+i];
                }
                this[iChannel] = iValue;
            }

            if(isArrayChannelValues) {
                this.channelValues = channelValues;
            }

            if(maybeName && typeof maybeName === "string") {
                this.name = name;
            }
            return this;
        }
    },
    name: {
        value: undefined
    },
    colorSpace: {
        value: undefined
    },
    channelValues: {
        value: undefined
    },

    alphaMax: {
        value: 1
    },

    alpha: {
        get: function() {
            return this.channelValues[3] || this.alphaMax;
        },
        set: function(value) {
            //Need to better constrain value
            this.channelValues[3] = (typeof value === "number" ? value : this.alphaMax);
        }
    },

    /**
     * Converts the color from it's colorSpace into anotherColorSpace.
     *,
    * @param {ColorSpace} colorSpace     The colorSpace to convert into
    * @return {Color}                          The receiver object, this
    */
    convertToColorSpace: {
        value: function(colorSpace) {
            if(colorSpace !== this.colorSpace) {
                console.error("Immplementation missing");
            }
            return this;
        }
    },

    /**
     * Create a new color from the receiver converted into anotherColorSpace.
     *,
    * @param {ColorSpace} colorSpace     The colorSpace to convert into
    * @return {Color}                   The new color converted into colorSpace
    */
    colorByConvertingToColorSpace: {
        value: function(colorSpace) {
            console.error("Immplementation missing");
            return this;
        }
    },

    serializeSelf: {
        value: function (serializer) {
            if(this.name) {
                serializer.setProperty("name", this.name);
            }
            if(this.colorSpace) {
                serializer.setProperty("colorSpace", this.colorSpace);
            }
            if(this.channelValues) {
                serializer.setProperty("channelValues", this.channelValues);
            }
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            var value;
            value = deserializer.getProperty("name");
            if (value !== void 0) {
                this.name = name;
            }
            value = deserializer.getProperty("colorSpace");
            if (value !== void 0) {
                this.colorSpace = colorSpace;
            }
            value = deserializer.getProperty("channelValues");
            if (value !== void 0) {
                this.channelValues = channelValues;
            }
        }
    }


},{
    withColorSpaceChannelValues: {
        value: function(colorSpace, channelValues,  /*optional*/name) {
            //TODO: The Color.withColorSpaceChannelValues shoould first identify the Color subclass used in that colorSpace
            //and instantiate that.
            //The relation about ColorSubclass and the ColorSpace they work in is MISSING right now.

        }
    }
});
