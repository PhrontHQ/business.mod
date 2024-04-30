var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class OrderTransaction
 * @extends DataObject
 */


var kind = [
        "description",          /* Void: A cancellation of a pending authorization or capture. */
        "Capture",              /* A transfer of the money that was reserved during the authorization stage. */
        "Change",               /* Money returned to the customer when they have paid too much. */
        "EMVAuthorization",     /* An authorization for a payment taken with an EMV credit card reader. */
        "Refund",               /*A partial or full return of captured funds to the cardholder. A refund can happen only after a capture is processed.*/
        "Sale",                 /*An authorization and capture performed together in a single step.*/
        "SuggestedRefund",      /*A suggested refund transaction that can be used to create a refund.*/
        "Authorization"         /* An amount reserved against the cardholder's funding source. Money does not change hands until the authorization is captured.*/
];


exports.OrderTransaction = DataObject.specialize(/** @lends OrderTransaction.prototype */ {

    order: {
        value: undefined
    },
    amount: {
        value: undefined
    },
    paymentGateway: {
        value: undefined
    }
});
