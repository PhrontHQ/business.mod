var DataObject = require("mod/data/model/data-object").DataObject,
    OrderLineItem = require("./order-line-item").OrderLineItem;

/**
 * @class Product
 * @extends Montage
 */



exports.Product = DataObject.specialize(/** @lends Product.prototype */ {

    name: {
        value: undefined
    },

    /* Backward compatibility */
    title: {
        get: function () {
            return this.name;
        },
        set: function (value) {
            this.name = value;
        }
    },

    description: {
        value: undefined
    },
    descriptionHtml: {
        value: undefined
    },
    collections: {
        value: null
    },
    _images: {
        value: null
    },
    images: {
        get: function () {
            return this._images || (this._images = []);
        },
        set: function (value) {
            if (this._images !== value) {
                this._images = value;
            }
        }
    },
    link: {
        value: undefined
    },
    productType: {
        value: undefined
    },
    unitCost: {
        value: undefined
    },
    settings: {
        value: undefined
    },
    sizeWxLxH: {
        value: undefined
    },
    notes: {
        value: undefined
    },
    schematics: {
        value: undefined
    },
    _vendor: {
        value: null
    },

    vendor: {
        get: function () {
            return this._vendor;
        },
        set: function (value) {
            if (this._vendor !== value) {
                this._vendor = value;
            }
        }
    },
    locations: {
        value: undefined
    },
    inStock: {
        get: function () {
            return this._inStock;
        },
        set: function (value) {
            if (this._inStock !== value) {
                this._inStock = value;
            }
        }
    },

    _inStock: {
        value: undefined
    },
    totalUnitsSold: {
        value: undefined
    },
    grossSales: {
        value: undefined
    },
    options: {
        value: undefined
    },
    orders: {
        value: undefined
    },
    tags: {
        value: undefined
    }
});
