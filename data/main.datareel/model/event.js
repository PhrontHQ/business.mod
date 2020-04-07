var Object = require("./object").Object;

/**
 * @class Image
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
 */


 /*
 {
  "kind": "calendar#event",
  "etag": etag,
  "id": string,
  "status": string,
  "htmlLink": string,
  "created": datetime,
  "updated": datetime,
  "summary": string,
  "description": string,
  "location": string,
  "colorId": string,
  "creator": {
    "id": string,
    "email": string,
    "displayName": string,
    "self": boolean
  },
  "organizer": {
    "id": string,
    "email": string,
    "displayName": string,
    "self": boolean
  },
  "start": {
    "date": date,
    "dateTime": datetime,
    "timeZone": string
  },
  "end": {
    "date": date,
    "dateTime": datetime,
    "timeZone": string
  },
  "endTimeUnspecified": boolean,
  "recurrence": [
    string
  ],
  "recurringEventId": string,
  "originalStartTime": {
    "date": date,
    "dateTime": datetime,
    "timeZone": string
  },
  "transparency": string,
  "visibility": string,
  "iCalUID": string,
  "sequence": integer,
  "attendees": [
    {
      "id": string,
      "email": string,
      "displayName": string,
      "organizer": boolean,
      "self": boolean,
      "resource": boolean,
      "optional": boolean,
      "responseStatus": string,
      "comment": string,
      "additionalGuests": integer
    }
  ],
  "attendeesOmitted": boolean,
  "extendedProperties": {
    "private": {
      (key): string
    },
    "shared": {
      (key): string
    }
  },
  "hangoutLink": string,
  "conferenceData": {
    "createRequest": {
      "requestId": string,
      "conferenceSolutionKey": {
        "type": string
      },
      "status": {
        "statusCode": string
      }
    },
    "entryPoints": [
      {
        "entryPointType": string,
        "uri": string,
        "label": string,
        "pin": string,
        "accessCode": string,
        "meetingCode": string,
        "passcode": string,
        "password": string
      }
    ],
    "conferenceSolution": {
      "key": {
        "type": string
      },
      "name": string,
      "iconUri": string
    },
    "conferenceId": string,
    "signature": string,
    "notes": string,
    "gadget": {
    "type": string,
    "title": string,
    "link": string,
    "iconLink": string,
    "width": integer,
    "height": integer,
    "display": string,
    "preferences": {
      (key): string
    }
  },
  "anyoneCanAddSelf": boolean,
  "guestsCanInviteOthers": boolean,
  "guestsCanModify": boolean,
  "guestsCanSeeOtherGuests": boolean,
  "privateCopy": boolean,
  "locked": boolean,
  "reminders": {
    "useDefault": boolean,
    "overrides": [
      {
        "method": string,
        "minutes": integer
      }
    ]
  },
  "source": {
    "url": string,
    "title": string
  },
  "attachments": [
    {
      "fileUrl": string,
      "title": string,
      "mimeType": string,
      "iconLink": string,
      "fileId": string
    }
  ]
}

*/


exports.Event = Object.specialize(/** @lends Event.prototype */ {
    constructor: {
        value: function Event() {
            this.super();
            //console.log("Phront Calendar created");
            return this;
        }
    },
    calendar: {
        value: undefined
    },
    kind: {
        value: undefined
    },
    etag: {
        value: undefined
    },
    status: {
        value: undefined
    },
    htmlLink: {
        value: undefined
    },
    created: {
        value: undefined
    },
    updated: {
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
    creator: {
        value: undefined
    },
    organizer: {
        value: undefined
    },
    timeRange: {
        value: undefined
    },
    endTimeUnspecified: {
        value: undefined
    },
    recurrence: {
        value: undefined
    },
    recurringEvent: {
        value: undefined
    },
    originalTimeRange: {
        value: undefined
    },
    transparency: {
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
    attendeesOmitted: {
        value: undefined
    },
    extendedProperties: {
        value: undefined
    },
    hangoutLink: {
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
    source: {
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
    }

});
