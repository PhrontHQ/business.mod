var Target = require("montage/core/target").Target,
    DataService = require("montage/data/service/data-service").DataService;

/**
 * @class Object
 * @extends Montage
 */


exports.Object = Target.specialize(/** @lends Object.prototype */ {
    constructor: {
        value: function Object() {
            this.super();
            return this;
        }
    },
    originId: {
        value: undefined
    },

    creationDate: {
        value: undefined
    },

    /**
     * Overrides nextTarget to have the data service be the next to receive events
     * @property {boolean} serializable
     * @property {Component} value
     */
    nextTarget: {
        serializable: false,
        get: function() {
            return DataService.mainService;
        }
    }


});
