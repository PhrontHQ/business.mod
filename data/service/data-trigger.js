var MontageDataTriggerModule = require("mod/data/service/data-trigger"),
    MontageDataTrigger = MontageDataTriggerModule.DataTrigger,
    MontageDataTriggerClassMethods = MontageDataTriggerModule._DataTriggerClassMethods,
    Map = require("mod/core/collections/map"),
    ChangeEvent = require("mod/core/event/change-event").ChangeEvent,
    DataTrigger;

/**
 * Intercepts all calls to get and set an object's property and triggers any
 * Montage Data action warranted by these calls.
 *
 * DataTrigger is a JavaScript Objects subclass rather than a Montage subclass
 * so data triggers can be as lightweight as possible: They need to be
 * lightweight because many will be created (one for each relationship or
 * lazily loaded property of each model class) and there's no benefit for them
 * to be derived from the Montage prototype because they don't use any of the
 * Montage class functionality.
 *
 * @private
 * @class
 * @extends DataObject
 */
DataTrigger = exports.DataTrigger = function () {};
DataTrigger.prototype = new MontageDataTrigger();
DataTrigger.prototype.constructor = DataTrigger;

//Pass-on static/class methods to subclass. We need to workaround that bug without impacting the rest of montage
for(var i=0, keys = Object.keys(MontageDataTriggerClassMethods), iKey;(iKey = keys[i]); i++) {
    if(iKey !== "_montage_metadata") {
        Object.defineProperty(DataTrigger, iKey, MontageDataTriggerClassMethods[iKey]);
    }
}

Object.defineProperties(DataTrigger.prototype, /** @lends DataTrigger.prototype */ {

    /**
     * Note that if a trigger's property value is set after that values is
     * requested but before it is obtained from the trigger's service the
     * property's value will only temporarily be set to the specified value:
     * When the service finishes obtaining the value the property's value will
     * be reset to that obtained value.
     *
     * @method
     * @argument {Object} object
     * @argument {} value
     */
    _setValue: {
        configurable: true,
        writable: true,
        value: function (object, value) {
            var status, prototype, descriptor, getter, setter = this._valueSetter, writable, currentValue, isToMany, isArray, initialValue, isLocalizable, objectLocales;

            // Get the value's current status and update that status to indicate
            // the value has been obtained. This way if the setter called below
            // requests the property's value it will get the value the property
            // had before it was set, and it will get that value immediately.
            status = this._getValueStatus(object);
            this._setValueStatus(object, null);

            initialValue = this._getValue(object);
            //If Array / to-Many
            isToMany = this.propertyDescriptor.cardinality !== 1;
            isArray = Array.isArray(initialValue);
            isLocalizable = this.propertyDescriptor.isLocalizable;
            objectLocales = object.locales || this._service.userLocales;

            // Set this trigger's property to the desired value, but only if
            // that property is writable.
            if (setter) {
                setter.call(object, value);
                //currentValue = value;
            } else if (this._isPropertyWritable) {

                if (isToMany && isArray && value) {
                    object[this._privatePropertyName].splice.apply(initialValue, [0, Infinity].concat(value));
                }
                else {
                    object[this._privatePropertyName] = value;
                }

            }

            currentValue = this._getValue(object);
            if(currentValue !== initialValue) {

                if(isToMany) {
                    if(initialValue && isArray) {
                        var listener = this._collectionListener.get(object);
                        if(listener) {
                            initialValue.removeRangeChangeListener(listener);
                            if(!currentValue) {
                                this._collectionListener.delete(object);
                            }
                        }
                    }
                    if(currentValue) {
                        if(Array.isArray(currentValue)) {
                            var self = this,
                                listener = function _triggerCollectionListener(plus, minus, index) {
                                    //If we're not in the middle of a mapping...:
                                    if(!self._service._objectsBeingMapped.has(object)) {
                                        //Dispatch update event
                                        var changeEvent = new ChangeEvent;
                                        changeEvent.target = object;
                                        changeEvent.key = self._propertyName;
                                        changeEvent.index = index;
                                        changeEvent.addedValues = plus;
                                        changeEvent.removedValues = minus;

                                        //To deal with changes happening to an array value of that property,
                                        //we'll need to add/cancel observing on the array itself
                                        //and dispatch added/removed change in the array's change handler.

                                        //Bypass EventManager for now
                                        self._service.rootService.handleChange(changeEvent);
                                    }
                                };

                            this._collectionListener.set(object,listener);
                            currentValue.addRangeChangeListener(listener);
                        }
                        else if(currentValue instanceof Map) {
                            console.error("DataTrigger misses implementation to track changes on property values that are Map");
                        }
                        else if(!isLocalizable || (objectLocales.length > 1)) {
                            /*
                                We end up here if the value is an embedded type. We would have to get the mapping to figure out that's the case, but there would be northing special to do
                            */
                            //console.error("DataTrigger misses implementation to track changes on property values that are neither Array nor Map");
                        }

                    }
                }
            }


//addRangeChangeListener

            //If we're not in the middle of a mapping...:
            if(currentValue !== initialValue && !this._service._objectsBeingMapped.has(object)) {
                //Dispatch update event
                var changeEvent = new ChangeEvent;
                changeEvent.target = object;
                changeEvent.key = this._propertyName;
                changeEvent.previousKeyValue = initialValue;
                changeEvent.keyValue = currentValue;

                //To deal with changes happening to an array value of that property,
                //we'll need to add/cancel observing on the array itself
                //and dispatch added/removed change in the array's change handler.

                //Bypass EventManager for now
                this._service.rootService.handleChange(changeEvent);
            }


            // Resolve any pending promise for this trigger's property value.
            if (status) {
                status.resolve(null);
            }
        }
    }


});
