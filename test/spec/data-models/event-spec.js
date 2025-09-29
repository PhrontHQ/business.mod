var mainService = require("business.mod/test/data/client-main.mod/main.mjson").montageObject,
Criteria = require("mod/core/criteria").Criteria,
DataStream = require("mod/data/service/data-stream").DataStream,
DataQuery = require("mod/data/model/data-query").DataQuery,
Range = require("mod/core/range").Range,
Event = require("business.mod/data/model/event").Event,
Calendar = require("business.mod/data/model/calendar").Calendar,
EventAttendee = require("business.mod/data/model/event-attendee").EventAttendee,
EventConferenceData = require("business.mod/data/model/event-conference-data").EventConferenceData,
Person = require("business.mod/data/model/person").Person,
EventSystemDescriptors = [Event,Calendar],
phrontServiceConnectionPromise = require("../phront-service-connection").promise;

//Test for loading .js witrh export / mport with require.
// var LocalizedString = require("mod/data/model/localized-string").LocalizedString;



describe("Events", function () {
    var tableExists = false,
        calendar,
        event,
        calendarCriteria = new Criteria().initWithExpression("summary == $summary", {
            summary: "this is a test calendar for Dr No."
        }),
        calendarQuery = DataQuery.withTypeAndCriteria(Calendar,calendarCriteria),
        today = new Date(),
        eventDescription = "Trying to figure stuff out on "+ today.toString(),
        eventCriteria = new Criteria().initWithExpression("description == $description", {
            description: eventDescription
        }),
        eventQuery = DataQuery.withTypeAndCriteria(Event,eventCriteria);



    //Can't do anything until we can talk to the backend:
    beforeEach(function () {
        return phrontServiceConnectionPromise;
    });

    describe("Create, Read, Update, Delete Events", function () {
        var originalTimeout;

        beforeEach(function () {

            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 240000;

            //First Verify Table Exists:
            if(tableExists) {
                return Promise.resolve(true);
            }

            return mainService.fetchData(DataQuery.withTypeAndCriteria(Event))
            .then(function (result) {
                console.log("fetched "+result.length+" Events");
                return mainService.fetchData(calendarQuery);
            }, function (error) {
                return Promise.reject(error);
            })
            .then(function (fetchResult) {
                //if found, we delete them.
                var i, countI, iCalendar;

                /*
                    TODO Need to add cascade delete to work so when we remove a calendar it removes all its events at the same time.
                */

                for(i=0, countI = fetchResult.length;(i<countI);i++) {
                    mainService.deleteDataObject(fetchResult[i]);
                }
                tableExists = true;
                return mainService.saveChanges();

            }, function(error) {
                if((error.message.indexOf('"phront.Calendar" does not exist') !== -1) || (error.message.indexOf('"phront.Event" does not exist') !== -1)) {
                    //We need to find a way expose the creation of a object descriptor's storage
                    //to the main data service.
                    var phrontClientService = mainService.childServices[0];
                    return Promise.all([
                        phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Event)),
                        phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Calendar))
                    ])
                    .then(function() {
                        tableExists = true;
                        return true;
                    });
                }
                else {
                    return Promise.reject(error);
                }
            });
        });

        afterEach(function() {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        describe("Create a Calendar and Events", function () {

            it("Create a Calendar and Events", function () {
                var attendeeOne, attendeeTwo;

                calendar = mainService.createDataObject(Calendar);
                calendar.summary = "this is a test calendar for Dr No.";
                calendar.description = "this is the descriptiono of a test calendar for Dr No.";
                calendar.location = "San Jose";
                calendar.timeZone = "America/Los_Angeles";

                /*
                    We need to implement and test the reverse, adding the event to the calendar, like:
                        calendar.events.add(event);
                    with the mainService/triggers doing the right thing in term of settin the graph client side and making sure it ends up how it should when data operations are executed.
                */

                var i=0, countI = 30,
                    j, countJ,
                    now = Date.now(),
                    year = today.getFullYear(),
                    month = today.getMonth(),
                    day = today.getDate(),
                    dayInMilliseconds = 24*60*60*1000,
                    hourInMilliseconds = 60*60*1000,
                    _40MinutesInMilliseconds = 60*60*1000,
                    start = new Date(year, month, 18, day,8,0),
                    eventBegin, eventEnd,
                    startUTCMilliseconds = start.valueOf(),
                    eventCount = 0;

                //Creates everyday a 40mn meeting every hours from 8am-5pm, starting from the day it runs.
                //Days loop
                for(;(i<countI);i++) {

                    //Intra-day loop
                    for(j=0, countJ = 9;(j<countJ); j++) {

                        event = mainService.createDataObject(Event);

                        event.calendar = calendar;
                        event.summary = "Meeting with myself and I #"+i;
                        event.description = eventDescription;

                        /*
                            new Date(year, monthIndex [, day [, hours [, minutes [, seconds [, milliseconds]]]]])
                        */
                        // eventBegin = startUTCMilliseconds + i*dayInMilliseconds + j*hourInMilliseconds;
                        // eventEnd = eventBegin + _40MinutesInMilliseconds;
                        eventBegin = new Date(year, month, day+i, 8+j, 0, 0, 0);
                        //Random duration of max 59mn
                        eventEnd = new Date(year, month, day+i, 8+j, Math.floor(Math.random() * Math.floor(59)), 59, 999);
                        event.timeRange = new Range(new Date(eventBegin), new Date(eventEnd));

                        attendeeOne = new EventAttendee();
                        attendeeOne.email = "marchant@mac.com";
                        attendeeOne.displayName = "Benoit Marchant (@mac.com)";

                        attendeeTwo = new EventAttendee();
                        attendeeTwo.email = "benoit@phront.com";
                        attendeeTwo.displayName = "Benoit Marchant (@phront.com)";
                        attendeeTwo.isOrganizer = true;

                        event.attendees = [attendeeOne,attendeeTwo];

                        eventCount++;
                    }

                }
                console.log(eventCount+" events created");
                return mainService.saveChanges()
                    .then(function (createCompletedOperation) {
                        //Fetch to make sure it was created
                        return mainService.fetchData(eventQuery);
                    }, function (error) {
                        return Promise.reject(error);
                    })
                    .then(function (result) {
                        expect(result.length).toBe(eventCount);
                    }, function (error) {
                        return Promise.reject(error);
                    });
            });


            it("Updates a calendar description and save changes", function () {
                calendar.description = "this is the description of a test calendar for Dr Yes.";
                return mainService.saveChanges();
            });
/*
            it("Deletes a calendar and event", function () {
                mainService.deleteDataObject(calendar);
                mainService.deleteDataObject(event);
                return mainService.saveChanges()
                .then(function () {
                    return mainService.fetchData(calendarQuery)
                })
                .then(function (fetchResult) {
                    expect(fetchResult.length).toBe(0);
                });

            });
*/

        });


    });

});
