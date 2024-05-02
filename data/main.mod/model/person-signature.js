var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class PersonSignature
 * @extends DataObject
 *
 * Models the signature of a person
 *
 */


exports.PersonSignature = DataObject.specialize(/** @lends Collection.prototype */ {

    person: {
        value: undefined
    },
    jsonData: {
        value: undefined
    }

});
