var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class DeviceConfiguration
 * @extends DataObject
 * 
 */

/*
    "id": 1854,
    "value": "HNAAD",
    "descriptions": [
        {
            "id": 1539,
            "value": "PERIMETER ANTI-THEFT"
        }
    ],
    "summary": false

*/

exports.DeviceConfiguration = DataObject.specialize(/** @lends Feature.prototype */ {

    /**
     * doo doo doo, da da da
     *
     * @property {String} value
     * @default null
     */
    code: {
        value: undefined
    },

    /**
     * doo doo doo, da da da
     *
     * @property {String} value
     * @default null
     */
    description: {
        value: undefined
    },

    /**
     * doo doo doo, da da da
     *
     * @property {Vehicles[]} value
     * @default null
     */
    associatedVehicles: {
        value: undefined
    },

    /**
     * doo doo doo, da da da
     *
     * @property {UsageConditionCode[]} value
     * @default null
     */
    usageConditionCodesFeaturedIn: {
        value: undefined
    }   
});
