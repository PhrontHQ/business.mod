var DataObject = require("montage/data/model/data-object").DataObject,
    Enum = require("montage/core/enum").Enum;


/**
 * @class Order
 * @extends DataObject
 *
 * Modeled after https://shopify.dev/docs/admin-api/graphql/reference/object/order
 */

 var orderCancellationReasons = [
    "Customer",       /* The customer wanted to cancel the order */
    "Declined",       /* Payment was declined. */
    "Fraud",          /* The order was fraudulent. */
    "Inventory",      /* There was insufficient inventory.*/
    "Other"           /* Some other reason not listed. */
];

/*

    TODO:


    I think it makes sense to embed orders inside each customer-supplier-relationship row as a json array.
    that way more important data will be togethe close-by
*/


exports.OrderCancellationReason = new Enum().initWithMembersAndValues(orderCancellationReasons,orderCancellationReasons);

exports.Order = DataObject.specialize(/** @lends Order.prototype */ {

    name: {
        value: undefined
    },


    /**
     * Person or User Identity (WIP, to be refined) who placed the order. Not all orders have customers associated with them
     *
     * @property {Person | UserIdentity} value
     * @default null
     */
    customer: {
        value: undefined
    },


    /**
     * individual product/variants and service/variants purchased
     *
     * @property {OrderLineItem[]} value
     * @default null
     */
    orderLineItems: {
        value: undefined
    },

    /**
     * individual product/variants and service/variants purchased
     *
     * @property {OrderTransaction[]} value
     * @default null
     */
    transactions: {
        value: undefined
    },


    /**
     * Mailing address provided by the customer. Not all orders have mailing addresses.
     *
     * @property {Address} value
     * @default null
     */
    billingAddress: {
        value: undefined
    },

    /**
     * Mailing address provided by the customer. Not all orders have mailing addresses.
     *
     * @property {Address} value
     * @default null
     */
    shippingAddress: {
        value: undefined
    },

    /**
     * Whether the billing address matches the shipping address.
     *
     * @property {boolen} value
     * @default false
     */
    doesBillingAddressMatchShippingAddress: {
        value: false
    },

    /**
     * Date and time when the order was canceled. Returns null if the order wasn't canceled.
     *
     * @property {Date} value
     * @default false
     */
    cancellationDate: {
        value: undefined
    },

    /**
     * Reason the order was canceled. Returns null if the order wasn't canceled.
     *
     * @property {OrderCancellationReason} value
     * @default null
     */
    cancellationReason: {
        value: undefined
    },

});
