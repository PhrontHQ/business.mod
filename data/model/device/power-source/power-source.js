var Device = require("../../device").Device;

/**
 * @class ConnectedDevice
 * @extends PoweredDevice
 * 
 */

exports.PowerSource = Device.specialize(/** @lends PowerSource.prototype */ {
    energyType: {
        value: undefined
    }

});
