// ES6 myModule.js

/*
    Not allowed in a function, so can't be combined with our automatic wrapper for commonJS
*/
//import LIGHTSPEED from './module-x.js';

/*
    This works fine inside commonJS wrapper, but relative URL when evaled
    are based on the script that does the eval...
*/
// var LIGHTSPEED;
// import ('http://127.0.0.1:8888/node_modules/business-data.mod/data/main.mod/model/module-x.js').then(function(module) {
//     LIGHTSPEED = module.LIGHTSPEED;
// });

//Thus is working client side, more work needed using the project esm:
//https://www.npmjs.com/package/esm
//https://github.com/standard-things/esm
// var LIGHTSPEED = (require)("./module-x.js").LIGHTSPEED;


/*
class List extends Array {
    constructor(...args) {
      super().push(...args);
    }
    // chainable push
    push(...args) {
      super.push(...args);
      return this;
    }
  }

  exports.List = List;

  const abc = new List('a', 'b').push('c');
  // Symbol.species by default grant same constructor
  abc.slice(2) instanceof List; // true
  console.log(abc);
  var set = new Set([1,2,3,4,5,6]);
  var other = List.from(set);
  console.log("other:",other);
  */
var Montage = require("montage/core/core").Montage,
    Locale = require("montage/core/locale").Locale;


class LocalizedString extends String {
    //ES2019
    //#localization = "blue";

    constructor(thing) {
        super(thing);

        /*
            As soon as an instance's property value is set, even when that very property has been defined as non enumerable, on it's prototype, it's considered enumerable on that instance.

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

/*

configurable: true
enumerable: false
value: undefined
writable: true

*/
Montage.defineProperty(LocalizedString, "_defaultLocale", {
    value: undefined
});

Montage.defineProperty(LocalizedString, "defaultLocale", {
    set: function(value) {
        this._defaultLocale = value;
    },
    get: function() {
        return this._defaultLocale || Locale.systenLocale;
    }
});

/*
    This changes the locale of all LocalizedString
    that haven't been set directly a locale that would
    override the prototype's default value
*/

Montage.defineProperty(LocalizedString.prototype, "localization", {
    set: function(value) {
        this._localization = value;
    },
    get: function() {
        return this._localization;
    }
});

Montage.defineProperty(LocalizedString, "locale", {
    set: function(value) {
        this.prototype._locale = value;
    },
    get: function() {
        return this.prototype._locale || this.defaultLocale;
    }
});


Montage.defineProperty(LocalizedString.prototype, "locale", {
    set: function(value) {
        this._locale = value;
    },
    get: function() {
        return this._locale || LocalizedString.defaultLocale;
    }
});






  exports.LocalizedString = LocalizedString;

  /*
  //Test
  const abc = new LocalizedString('a', 'b');
  var prop;
  abc.localization = {};
  console.log("Object.keys(abc):",Object.keys(abc));
  for( prop in abc) {
      console.log("for in on abc:",prop,"->",abc[prop]);
  }
  console.log("JSON.stringify(abc):",JSON.stringify(abc));
  */

