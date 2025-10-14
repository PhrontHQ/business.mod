var Intangible = require("mod/data/model/party/intangible").Intangible;

/**
 * @class DeviceProtocol
 * @extends Intangible
 * 
 */

exports.DeviceProtocol = Intangible.specialize(/** @lends DeviceProtocol.prototype */ {

    name: {
        value: undefined
    },

    /*
        Partial because temporary
    */
    // deserializeSelf: {
    //     value: function(deserializer) {
    //         this.super(deserializer);

    //         var value;
    //         value = deserializer.getProperty("name");
    //         if (value !== void 0) {
    //             this.name = value;
    //         }

    //         value = deserializer.getProperty("identifier");
    //         if (value !== void 0) {
    //             this.identifier = value;
    //         }

    //     }
    // }

});
