console.log("Starting Google Calendar API Sandbox");

/*

From https://hackernoon.com/my-journey-integrating-google-calendar-g-suite-in-node-62fbc8596455

*/

const google = require("googleapis").google;
const calendar = google.calendar("v3");

(async function () {

   /* Option 1
    const Auth = new google.auth.GoogleAuth({
        scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.settings.basic',
            'https://www.googleapis.com/auth/gmail.settings.sharing',
            'https://www.googleapis.com/auth/admin.directory.user',
        ],
        keyFilename: '/Users/benoit/Sites/marchant/etiama/phront/data/google-calendar.datareel/service/service-account-authorization/storephront-a49b036d6822.json',
        clientOptions: { subject: 'storephront-service@storephront.iam.gserviceaccount.com' }
    });

    const auth = await Auth.getClient();
    */



/* Option 0

    const scopes = ['https://www.googleapis.com/auth/calendar'];
    const keyFile = '/Users/benoit/Sites/marchant/etiama/phront/data/google-calendar.datareel/service/service-account-authorization/storephront-259805-98fb8c147018.json';   // Your should make it an environment variable




    const client = await google.auth.getClient({
        keyFile,
        scopes,
    });

    // Delegated Credential
    client.subject = "storephront-service@storephront-259805.iam.gserviceaccount.com";

    const res = await calendar.calendarList.list({
        auth: client
    });

    res.data.items.forEach(function(cal) {
        console.log(cal.summary + " - " + cal.id);
    });

    */


   function listUsers(auth) {
    const service = google.admin({version: 'directory_v1', auth});
    service.users.list({
      customer: 'my_customer',
      maxResults: 10,
      orderBy: 'email',
    }, (err, res) => {
      if (err) return console.error('The API returned an error:', err.message);

      const users = res.data.users;
      if (users.length) {
        console.log('Users:');
        users.forEach((user) => {
          console.log(`${user.primaryEmail} (${user.name.fullName})`);
        });
      } else {
        console.log('No users found.');
      }
    });
  }



   const key = require('/Users/benoit/Sites/marchant/etiama/phront/data/google-calendar.datareel/service/service-account-authorization/storephront-259805-98fb8c147018.json');
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


    // Create a new calendar


    /*
   Calendar Resource representations:
    {
  "kind": "calendar#calendarListEntry",
  "etag": etag,
  "id": string,
  "summary": string,
  "description": string,
  "location": string,
  "timeZone": string,
  "summaryOverride": string,
  "colorId": string,
  "backgroundColor": string,
  "foregroundColor": string,
  "hidden": boolean,
  "selected": boolean,
  "accessRole": string,
  "defaultReminders": [
    {
      "method": string,
      "minutes": integer
    }
  ],
  "notificationSettings": {
    "notifications": [
      {
        "type": string,
        "method": string
      }
    ]
  },
  "primary": boolean,
  "deleted": boolean,
  "conferenceProperties": {
    "allowedConferenceSolutionTypes": [
      string
    ]
  }
}
*/
    var aNewCalendar = {
        "summary": "this is a test calendar for Dr No.",
        "description": "this is a test calendar for Dr No.",
        "location": "San Jose",
        "timeZone": "America/Los_Angeles"
    };

    // Insert the new calendar
   var createdCalendar = calendar.calendars.insert({
    auth: jwtClient,
    resource:aNewCalendar
}, function(err, resp) {
    if (err) {
        console.error ('error: ',err)
    } else {
        console.log("resp: ",resp);
    }});







    listUsers(jwtClient);

    const calendarListResult = await calendar.calendarList.list({
        auth: jwtClient
    });
    console.log("calendarList is: ",calendarListResult.data.items);
    console.log("calendars is: ",calendar.calendars);

    // const calendarsResult = await calendar.calendars({
    //     auth: jwtClient
    // });
    // console.log("calendarsResult is: ",calendarsResult.data.items);


    calendarListResult.data.items.forEach(function(cal) {
        console.log(cal.summary + " - " + cal.id);
    });

    // Make an authorized request to list Calendar events.
    calendar.events.list({
        auth: jwtClient,
        calendarId: CALENDAR_ID
    }, function(err, resp) {
        console.log(resp);
    });




    var interval = 2; // how big single slot should be (in this case 2 hrs)

    function slotsFromEvents(rootStart, rootEnd,events,callBack) {
        var freeSlots = [];

        events.forEach(function (event, index) { //calculate free from busy times
            if (index == 0 && startDate < event.start) {
                freeSlots.push({startDate: startDate, endDate: event.start});
            }
            else if (index == 0) {
                startDate = event.end;
            }
            else if (events[index - 1].end < event.start) {
                freeSlots.push({startDate: events[index - 1].end, endDate: event.start});
            }

            if (events.length == (index + 1) && event.end < endDate) {
                freeSlots.push({startDate: event.end, endDate: endDate});
            }
        });


        if (events.length == 0) {
            freeSlots.push({startDate: startDate, endDate: endDate});
        }

        var temp = {}, hourSlots = [];
        freeSlots.forEach(function(free, index) {
            var freeHours = new Date(free.endDate).getHours() - new Date(free.startDate).getHours(), freeStart = new Date(free.startDate), freeEnd = new Date(free.endDate);
            while(freeStart.getHours()+freeHours+interval>=0) { // 11 + 4 + 2 >= 0
                if(freeHours>=interval) {
                    temp.e = new Date(free.startDate);
                    temp.e.setHours(temp.e.getHours()+freeHours);
                    temp.s = new Date(free.startDate);
                    temp.s.setHours(temp.s.getHours()+freeHours-interval);
                    if(temp.s.getHours() >= rootStart.getHours() && temp.e.getHours() <= rootEnd.getHours()) {
                        hourSlots.push({calName: calObj.name, startDate:temp.s, endDate:temp.e});
                        temp = {};
                    }
                }
                freeHours--;
            }
        })

        callBack(freeSlots, hourSlots);
    }




    var startDate = new Date('20 November 2019 12:00'),
        startDateString = startDate.toISOString(),
        endDate = new Date('28 November 2019 13:00'),
        endDateString = endDate.toISOString(),
        check = {
            auth: jwtClient,
            resource: {
                timeMin: startDateString,
                timeMax: endDateString,
                items: [{id: CALENDAR_ID}]
            }
        }

    calendar.freebusy.query (check, {
        fields: "calendars,groups,kind,timeMax,timeMin",
        alt:"json"
    }, function (err, response) {
        if (err) {
            console.log ('error: ' + err)
        } else {
            console.log("freebusy:", response);
            var data = response.data,
                calendars = data.calendars, //Object
                calendarName, calendarEntries, busyTimes, i, iRange, countI;

            for(calendarName in calendars) {
                calendarEntries = calendars[calendarName];
                busyTimes = calendarEntries.busy;
                countI = busyTimes.length;
                for(i=0;i<countI;i++) {
                    iRange = busyTimes[i];
                    console.log("Busy from "+iRange.start + " to "+ iRange.end);
                }

                // then calculate free slots
                return slotsFromEvents(startDate, endDate, busyTimes, function(freeSlots, hourSlots) {
                    console.log("freeSlots:",freeSlots," hourSlots:",hourSlots);
                });

            }


        }
    })



    console.log(JSON.stringify(calendarListResult.data));
})();
