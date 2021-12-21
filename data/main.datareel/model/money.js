var Montage = require("montage/core/core").Montage;

/**
 * @class Money
 * @extends Montage
 */



exports.Money = Montage.specialize(/** @lends Product.prototype */ {

    amount: {
        value: undefined
    },
    currencyCode: {
        value: undefined
    }
});
