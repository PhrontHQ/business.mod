const google = require("googleapis").google;
const calendar = google.calendar("v3");

var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    Criteria = require("montage/core/criteria").Criteria,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    DataQuery = require("montage/data/model/data-query").DataQuery,
    DataStream = require("montage/data/service/data-stream").DataStream,
    Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    uuid = require("montage/core/uuid"),
    DataOrdering = require("montage/data/model/data-ordering").DataOrdering,
    DESCENDING = DataOrdering.DESCENDING,
    evaluate = require("montage/frb/evaluate"),
    Set = require("montage/collections/set"),
    GoogleCalendarService;


    const key = require('/data/google-calendar.datareel/service/service-account-authorization/storephront-259805-98fb8c147018.json');


//This will need to be factored out to be reused for other contex.
//It's tied with hard cooded connection infos.
    const jwtClient = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        [ 'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/admin.directory.user' ],
        "benoit@phront.com"
    );
    const CALENDAR_ID = 'benoit@phront.com';

    jwtClient.authorize(function(err, tokens) {
         if (err) {
             console.log(err);
             return;
         }
     });

/**
* TODO: Document
*
* @class
* @extends RawDataService
*/
exports.GoogleCalendarService = GoogleCalendarService = RawDataService.specialize(/** @lends GoogleCalendarService.prototype */ {


    constructor: {
        value: function GoogleCalendarService() {
            RawDataService.call(this);
        }
    },

    handleCreate: {
        value: function(operation) {
            var data = operation.data;
        }
    },

    handleRead: {
        value: function(operation) {
          var data = operation.data,
            criteria = operation.criteria,
              rawReadExpressionMap;
        }
    },

    handleEventRead: {
        value: function(operation) {
        var data = operation.data,
          criteria = operation.criteria;

        return new Promise(function(resolve,reject) {

            // Make an authorized request to list Calendar events.
            calendar.events.list({
                auth: jwtClient,
                calendarId: CALENDAR_ID,
                "orderBy" : "startTime", //No compatible with recurring events if  singleEvents: true, isn't included
                //maxResults: 10,
                singleEvents: true,
                "timeMin":  new Date('1 February 2020 12:00').toISOString(),
                "timeMax":  new Date('10 February 2020 12:00').toISOString()
            }, function(err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    reject(err);
                }
                console.log(response);
                //events:
                resolve(response.data.items);
            });
        });



        }
    },

    handleUpdate: {
        value: function(operation) {
          var data = operation.data;
        }
    },

    handleDelete: {
        value: function(operation) {
          var data = operation.data;
        }
    }

});
