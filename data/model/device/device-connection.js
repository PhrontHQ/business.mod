var Device = require("./device").Device;

/**
 * @class FasteningActuator
 * @extends Device
 * 
 */

exports.DeviceConnection = Device.specialize(/** @lends FasteningActuator.prototype */ {

    /*
        Partial because temporary
    */
        deserializeSelf: {
            value: function(deserializer) {
                this.super(deserializer);
    
                var value;

                value = deserializer.getProperty("identifier");
                if (value !== void 0) {
                    this.identifier = value;
                }

                value = deserializer.getProperty("host");
                if (value !== void 0) {
                    this.host = value;
                }

                value = deserializer.getProperty("node");
                if (value !== void 0) {
                    this.node = value;
                }

                value = deserializer.getProperty("role");
                if (value !== void 0) {
                    this.role = value;
                }
                
                value = deserializer.getProperty("logicalNodeNumber");
                if (value !== void 0) {
                    this.logicalNodeNumber = value;
                }

                value = deserializer.getProperty("logicalNodeNumberRange");
                if (value !== void 0) {
                    this.logicalNodeNumberRange = value;
                }

                value = deserializer.getProperty("physicalInterface");
                if (value !== void 0) {
                    this.physicalInterface = value;
                }

                value = deserializer.getProperty("logicalInterface");
                if (value !== void 0) {
                    this.logicalInterface = value;
                }


            }
        }
    
});
