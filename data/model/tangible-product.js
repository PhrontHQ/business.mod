var Product = require("./product").Product;

/**
 * @class Service
 * @extends Product
 */

/*

requiredResources: This can be anything from person to tools, to consumable materials. It is an open relatiionship. Could be modeled as a hstore key is uuid, value the tableName?

*/

exports.TangibleProduct = Product.specialize(/** @lends Product.prototype */ {

});
