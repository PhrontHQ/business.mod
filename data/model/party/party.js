const Party = require("mod/data/model/party/party").Party,
    Montage = require("mod/core/core").Montage;

/**
 * @class Party
 * @extends DataObject
 */


exports.Party = Party;

Montage.defineProperties(Party.prototype, {
    calendars: {
        value: undefined
    }
});

