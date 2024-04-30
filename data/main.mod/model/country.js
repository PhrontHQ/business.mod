var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class Country
 * @extends DataObject
 *
 *
 * https://www.iso.org/glossary-for-iso-3166.html
 * https://www.iso.org/obp/ui/#iso:code:3166:US
 *
 * https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
 *
 * https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes#cite_note-CIA-6
 *
 *
 */


exports.Country = DataObject.specialize(/** @lends Collection.prototype */ {

    iso3166_1_alpha2Ccode: {
        value: undefined
    },
    iso3166_1_alpha3Code: {
        value: undefined
    },
    iso3166_1_numericCode: {
        value: undefined
    },
    geometry: {
        value: undefined
    },
    officialStateName: {
        value: undefined
    },
    name: {
        value: undefined
    },
    phoneCode: {
        value: undefined
    },
    timeZones: {
        value: undefined
    }

});
