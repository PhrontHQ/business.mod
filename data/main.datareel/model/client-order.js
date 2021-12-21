var Montage = require("montage/core/core").Montage;

/**
 * @class ClientOrder
 * @extends Montage
 */


exports.ClientOrder = Montage.specialize(/** @lends ClientOrder.prototype */ {

    name: {
        value: undefined
    },
    client: {
        value: undefined
    },
    orderLineItems: {
        value: undefined
    },
    fulfillBy: {
        value: undefined
    },
    invoice: {
        value: undefined
    },
    orderNumber: {
        value: undefined
    },
    status: {
        value: undefined
    },
    orderTotalCost: {
        value: undefined
    },
    billTo: {
        value: undefined
    }

});
