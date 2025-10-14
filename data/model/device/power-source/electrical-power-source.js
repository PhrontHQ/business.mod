var PowerSource = require("./power-source").PowerSource;

/**
 * @class ElectricalPowerSource
 * @extends PowerSource
 * 
 */

exports.ElectricalPowerSource = PowerSource.specialize(/** @lends ElectricalPowerSource.prototype */ {
    amperageRange: {
        value: undefined
    },
    voltageRange: {
        value: undefined
    },
    currentType: {
        value: undefined
    }
});
