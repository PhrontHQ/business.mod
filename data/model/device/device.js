var Tangible = require("mod/data/model/party/tangible").Tangible;

/**
 * @class Device
 * @extends Tangible
 * 
 */

exports.Device = Tangible.specialize(/** @lends Device.prototype */ {

    deserializeSelf: {
        value: function(deserializer) {
            this.super(deserializer);

            var value;
            value = deserializer.getProperty("name");
            if (value !== void 0) {
                this.name = value;
            }

            value = deserializer.getProperty("model");
            if (value !== void 0) {
                this.model = value;
            }

            var value;
            value = deserializer.getProperty("aliases");
            if (value !== void 0) {
                this.aliases = value;
            }

            value = deserializer.getProperty("identifier");
            if (value !== void 0) {
                this.identifier = value;
            }

            value = deserializer.getProperty("manufacturer");
            if (value !== void 0) {
                this.manufacturer = value;
            }

            value = deserializer.getProperty("supportedProtocols");
            if (value !== void 0) {
                this.supportedProtocols = value;
            }

            value = deserializer.getProperty("compatibleAccessoryDevices");
            if (value !== void 0) {
                this.compatibleAccessoryDevices = value;
            }

            value = deserializer.getProperty("urlAddresses");
            if (value !== void 0) {
                this.urlAddresses = value;
            }

            value = deserializer.getProperty("typeInstances");
            if (value !== void 0) {
                this.typeInstances = value;
            }

            value = deserializer.getProperty("hostDeviceConnections");
            if (value !== void 0) {
                this.hostDeviceConnections = value;
            }

            
        }
    },

    /**
     * Identifier (looks like a unique id/name) given by GSPAS
     * We may add a human readable 'title' in addition ... 
     *
     * @property {String} value
     * @default null
     */
    originId: {
        value: undefined
    },

    /**
     * Human readable description of device
     * e.g., `RT ANGLE NUTRUNNER TORQUE SHUT OFF -REV. (ELECTRIC)`
     *
     * @property {String} value
     * @default null
     */
    description: {
        value: undefined
    },

    powerSource: {
        value: undefined
    }
});
