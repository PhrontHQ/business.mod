var Montage = require("montage/core/core").Montage,
    Locale = require("montage/core/locale").Locale;

/**
 * An object that manages the separate parts of a person's name to structure storage
 * and allow locale-aware formatting.
 *
 * Inspired from:
 *  https://developer.apple.com/documentation/foundation/nspersonnamecomponents?language=objc API
 *
 * It is a subclass of String it is really a discretization
 * of the different ways a person is named
 *
 * @class
 * @extends external:Montage
 */

exports.PersonName = Montage.specialize(/** @lends EventPerson.prototype */ {
    constructor: {
        value: function PersonName() {
            this.super();
            //console.log("Phront PersonName created");
            return this;
        }
    },
    namePrefix: {
        value: undefined
    },
    givenName: {
        value: undefined
    },
    middleName: {
        value: undefined
    },
    familyName: {
        value: undefined
    },
    previousFamilyName: {
        value: undefined
    },
    nameSuffix: {
        value: undefined
    },
    nickname: {
        value: undefined
    },
    previousFamilyName: {
        value: undefined
    },
});
