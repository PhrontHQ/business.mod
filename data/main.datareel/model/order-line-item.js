var DataObject = require("./data-object").DataObject;

/**
 * @class OrderLineItem
 * @extends DataObject
 */



exports.OrderLineItem = DataObject.specialize(/** @lends OrderLineItem.prototype */ {

    name: {
        value: undefined
    },
    quantity: {
        value: undefined
    },

    /**
     * Product or Service Engagement, to be specialized by sub types
     *
     * @property {Product | ServiceEngagement} value
     * @default null
     */
    purchasedItem: {
        value: undefined
    },

    /**
     * The variant of the purchased product of Service purchased, to be specialized by sub types
     *
     * @property {Product | ServiceEngagement} value
     * @default null
     */
    purchasedVariant: {
        value: undefined
    },
    price: {
        value: undefined
    },
    totalCost: {
        value: undefined
    },
    belongsToOrder: {
        value: undefined
    }

});
