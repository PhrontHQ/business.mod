var DataObject = require("./data-object").DataObject;

/**
 * @class Event
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends DataObject
 */


 /*

    In Apple's EventKit, Location is:

    https://developer.apple.com/documentation/corelocation/cllocation?language=objc

 */


/**
 * Notes: all-day events:
 *
 * https://github.com/mozilla-comm/ical.js/issues/353
 *
 *  I can't find anything in the RFC about all day events,
 * but both Outlook and Google are able to determine if an event is all day.
 * Looking at an ics file with all day events, when the DTSTART and DTEND are both in this format:
 *
 * DTSTART;VALUE=DATE:20180316
 * DTEND;VALUE=DATE:20180317
 *
 * the event is 'All Day'
 *
 * and if the DTSTART/END are either:
 *
 * DTSTART:20180119T173000Z
 * DTEND:20180119T182000Z
 *
 * or
 *
 * DTSTART;TZID="(UTC-06:00) Central Time (US & Canada)":20180630T080000
 * DTEND;TZID="(UTC-06:00) Central Time (US & Canada)":20180630T083000
 * The event is not all day. Does ical.js give a higher order method to detect all day events?
 * Is it just a matter of checking that start and end are exactly 24 hours apart,
 * and are at midnight exactly?
 *
 * var dtstart = vevent.getFirstPropertyValue('dtstart');
 * var dtend = vevent.getFirstPropertyValue('dtend');
 *
 * if (dtstart.isDate && dtend.isDate)
 *      event.isAllDay = true;
 *
 * In JS, if no hours/minutes/seconds are speficified, it stays that way:
 * > new Date(this.year, this.month - 1, this.day).getHours()
 * < NaN
 *
 * ICAL time (CalendarDate in montage has isDate property, we should add that to our Event to avoid confusion).
 */


 /*
https://icalendar.org/CalDAV-Access-RFC-4791/7-10-caldav-free-busy-query-report.html

free-busy-query REPORT generates a VFREEBUSY component containing free busy information for all the calendar object resources targeted by the request and that have the CALDAV:read-free- busy or DAV:read privilege granted to the current user.

Only VEVENT components without a TRANSP property or with the TRANSP property set to OPAQUE, and VFREEBUSY components SHOULD be considered in generating the free busy time information.

In the case of VEVENT components, the free or busy time type (FBTYPE) of the FREEBUSY properties in the returned VFREEBUSY component SHOULD be derived from the value of the TRANSP and STATUS properties, as outlined in the table below:

   +---------------------------++------------------+
   |          VEVENT           ||    VFREEBUSY     |
   +-------------+-------------++------------------+
   | TRANSP      | STATUS      || FBTYPE           |
   +=============+=============++==================+
   |             | CONFIRMED   || BUSY             |
   |             | (default)   ||                  |
   | OPAQUE      +-------------++------------------+
   | (default)   | CANCELLED   || FREE             |
   |             +-------------++------------------+
   |             | TENTATIVE   || BUSY-TENTATIVE   |
   |             +-------------++------------------+
   |             | x-name      || BUSY or          |
   |             |             || x-name           |
   +-------------+-------------++------------------+
   |             | CONFIRMED   ||                  |
   | TRANSPARENT | CANCELLED   || FREE             |
   |             | TENTATIVE   ||                  |
   |             | x-name      ||                  |
   +-------------+-------------++------------------+
Duplicate busy time periods with the same FBTYPE parameter value SHOULD NOT be specified in the returned VFREEBUSY component. Servers SHOULD coalesce consecutive or overlapping busy time periods of the same type. Busy time periods with different FBTYPE parameter values MAY overlap.


Reschedule:

This section specifies additional requirements on the handling of the "PARTSTAT" property parameter when the "SCHEDULE-AGENT" property parameter on the corresponding "ATTENDEE" property is set to the value "SERVER" or is not present.

A reschedule occurs when any "DTSTART", "DTEND", "DURATION", "DUE", "RRULE", "RDATE", or "EXDATE" property changes in a calendar component such that existing recurrence instances are impacted by the changes, as shown in the table below. Servers MUST reset the "PARTSTAT" property parameter value of all "ATTENDEE" properties, except the one that corresponds to the "Organizer", to "NEEDS-ACTION" for each calendar component change that causes any instance to be rescheduled.


Status, Appointments:
https://www.hl7.org/fhir/appointment.html
http://hl7.org/fhir/summary.html

Roles: https://www.hl7.org/fhir/valueset-encounter-participant-type.html

AppointmentStatus:
https://www.hl7.org/fhir/valueset-appointmentstatus.html


 */


/*
    TODO: the following are aggregate of states amonng all childEvents of the organizer's root one:

    Proposed:	None of the participant(s) have finalized their acceptance of the appointment request, and the start/end time might not be set yet.

    Pending:	Some or all of the participant(s) have not finalized their acceptance of the appointment request.

    Booked:	All participant(s) have been considered and the appointment is confirmed to go ahead at the date/times specified.

*/


exports.Event = DataObject.specialize(/** @lends Event.prototype */ {
    constructor: {
        value: function Event() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    participatingParty: {
        value: undefined
    },
    resourceType: {
        value: undefined
    },
    calendar: {
        value: undefined
    },
    scheduledTimeRange: {
        value: undefined
    },
    actualTimeRange: {
        value: undefined
    },
    parent: {
        value: undefined
    },
    children: {
        value: undefined
    },
    isBlocking: {
        value: undefined
    },
    participation: {
        value: undefined
    },
    participationRoles: {
        value: undefined
    },
    participationStatus: {
        value: undefined
    },
    participationStatusLog: {
        value: undefined
    },
    eventURL: {
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
    color: {
        value: undefined
    },
    organizer: {
        value: undefined
    },
    isAllDay: {
        value: undefined
    },
    recurrenceRule: {
        value: undefined
    },
    recurringEvent: {
        value: undefined
    },
    visibility: {
        value: undefined
    },
    iCalUID: {
        value: undefined
    },
    sequence: {
        value: undefined
    },
    attendees: {
        value: undefined
    },
    conferenceData: {
        value: undefined
    },
    anyoneCanAddSelf: {
        value: undefined
    },
    guestsCanInviteOthers: {
        value: undefined
    },
    guestsCanModify: {
        value: undefined
    },
    guestsCanSeeOtherGuests: {
        value: undefined
    },
    privateCopy: {
        value: undefined
    },
    locked: {
        value: undefined
    },
    reminders: {
        value: undefined
    },
    attachments: {
        value: undefined
    },
    task: {
        value: {
            task: "Task-Proto-task-property",
            name: "Task-Proto-name-property"
        }
    },
    _isAllDay: {
        value: false
    },
    isAllDay: {
        set: function (value) {
            if (this._isAllDay !== !!value) {
                this._isAllDay = !!value;
            }
        },
        get: function () {
            return this._isAllDay;
        }
    }
    /*
    ,
    isAllDay: {
        value: false
    }
    */

});
