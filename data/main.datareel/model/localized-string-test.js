// ES6 myModule.js
// This was a test, capability to do so is disabled in mr for now
// import {LIGHTSPEED} from './module-x.js';

class LocalizedString extends String {
    //ES2019
    //#localization = "blue";

    constructor(thing) {
        super(thing);

        /*
            As soon as an instance's property value is set, evem when that very property has been defined as non enumerable, on it's prototype, it's considered enumerable on that instance.

            So the only way to keep it non-enumerable is to redefine per instance, or use a shared WeakMap Instance -> Map [privateVariableName -> value]
        */
        //console.log("this.#localization",this.#localization);

        Object.defineProperty(this, "_localization",
        {
            configurable: true,
            value: undefined,
            writable: true,
            enumerable: false
        });
    }
};


  exports.LocalizedString = LocalizedString;

  //Test ES6
  export default {
    LocalizedString: LocalizedString
  };
