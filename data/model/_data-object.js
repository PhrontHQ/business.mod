var Target = require("mod/core/target").Target,
DataService = require("mod/data/service/data-service").DataService,
DataEvent = require("mod/data/model/data-event").DataEvent;

/**
 * @class DataObject
 * @extends Montage
 */


 /*
    Need to be able to set creationDate when an instance is created by
    the DataService. Not when the instance is created by the constructor.

    A proposal is to have a "datacreate" or "create" event whose target is
    the new instance. That is listened to by some code that does it.

    We could then later build a UI to do the same visually.
*/


exports.DataObject = Target.specialize(/** @lends DataObject.prototype */ {
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
    modificationDate: {
        value: undefined
    },
    publicationDate: {
        value: undefined
    }

},{

    /*
        This class methods are polymorphic, which poses a problem.
        Object needs to receive create events from Object instances and all instances inheriting from Object.

        So it needs to listen to dataService and filter, which is a bit wasteful
        or we could propagate the event with nextTarget to go through the propertyDescriptor hierarchy and then Object can listen only on it's Object Descriptor.

        BUT as these methds are inherited when declared in specializes, the handle methods are a problem.

    */

    /**
     * prepareToHandleDataEvents helps register lazily prepare DO's custom logic.
     * Each type listens to events issued by it's corresponding ObjectDescriptor
     * @param {DataEvent} event the first event triggering the prepareToHandleDataEvents
     */

    prepareToHandleDataEvents: {
        value: function (event) {
            event.dataService.objectDescriptorForType(this).addEventListener(DataEvent.create,this,false);
        }
    },
    handleCreate: {
        value: function (event) {
            // if(event.dataObject instanceof this) {
                event.dataObject.creationDate = event.dataObject.modificationDate = new Date();
            // }
        }
    },
    handleUpdate: {
        value: function (event) {
            event.dataObject.modificationDate = new Date();
        }
    }


});
