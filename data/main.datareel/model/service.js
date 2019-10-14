var Product = require("./product").Product;

/**
 * @class Service
 * @extends Product
 */



exports.Service = Product.specialize(/** @lends Product.prototype */ {

    duration: {
        value: undefined
    },
    requirements: {
        value: undefined
    }       

});