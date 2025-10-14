var Device = require("../../device/device").Device;

/**
 * @class PowerSource
 * @extends Device
 * 
 */

exports.PowerSource = Device.specialize(/** @lends PowerSource.prototype */ {
    energyType: {
        value: undefined
    }

});
