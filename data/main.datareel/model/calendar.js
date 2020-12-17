var DataObject = require("./data-object").DataObject;

/*

Ideally we'd want Phroont's calendar type to specialize Montage's Calendar, but we aso need things in Object... hmmm

MontageCalendar = require("montage/core/date/calendar").Calendar,
*/

/**
 * @class Calendar
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends DataObject
 */


exports.Calendar = DataObject.specialize(/** @lends Calendar.prototype */ {
    constructor: {
        value: function Calendar() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    kind: {
        value: undefined
    },
    etag: {
        value: undefined
    },
    summary: {
        value: undefined
    },
    description: {
        value: undefined
    },
    location: {
        value: undefined
    },
    conferenceProperties: {
        value: undefined
    },
    events: {
        value: undefined
    },
    color: {
        value: undefined
    }
});
