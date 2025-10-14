var ElectricalPowerSource = require("./electrical-power-source").ElectricalPowerSource;

/**
 * @class AlternativeCurrentPowerSource
 * @extends ElectricalPowerSource
 * 
 */

exports.AlternativeCurrentPowerSource = ElectricalPowerSource.specialize(/** @lends AlternativeCurrentPowerSource.prototype */ {
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
