var Object = require("../object").Object,
    RGBColorSpace = require("./r-g-b-color-space").RGBColorSpace,
    Color = require("./color").Color;

/**
 * @class RGBColor
 * @extends Color
 * @classdesc Represents a color (point) in RGB colorSpace.
 *
 */


exports.RGBColor = Color.specialize(/** @lends RGBColor.prototype */ {
    constructor: {
        //support a signature like (colorSpace, channel1, channel2, channel3, channel4, name)
        //or (colorSpace, [channel1, channel2, channel3, channel4], name)
        value: function(colorSpace, channelValues, name) {
            this.super(colorSpace, channelValues, name);
        }
    },
    r: {
        value: undefined
    },
    red: {
        get: function() {
            return this.r;
        },
        set: function(value) {
            this.r = value;
        }
    },
    g: {
        value: undefined
    },
    green: {
        get: function() {
            return this.g;
        },
        set: function(value) {
            this.g = value;
        }
    },
    b: {
        value: undefined
    },
    blue: {
        get: function() {
            return this.b;
        },
        set: function(value) {
            this.b = value;
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
    withChannelsInColorSpace: {
        value: function(channelValues, colorSpace, /*optional*/name) {


        }
    }
});

exports.LAB = DataObject.specialize(/** @lends Color.prototype */ {
