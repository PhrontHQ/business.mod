var mainService = require("phront/test/data/client-main.mod/main.mjson").montageObject,
Criteria = require("montage/core/criteria").Criteria,
DataStream = require("montage/data/service/data-stream").DataStream,
DataQuery = require("montage/data/model/data-query").DataQuery,
Range = require("montage/core/range").Range,
Event = require("phront/data/main.mod/model/event").Event,
Calendar = require("phront/data/main.mod/model/calendar").Calendar,
EventPerson = require("phront/data/main.mod/model/event-person").EventPerson,
EventAttendee = require("phront/data/main.mod/model/event-attendee").EventAttendee,
EventConferenceData = require("phront/data/main.mod/model/event-conference-data").EventConferenceData,
Person = require("phront/data/main.mod/model/person").Person,
EventSystemDescriptors = [Event,Calendar];

exports.crudEvent = function() {
    var calendar,
        event,
        calendarCriteria = new Criteria().initWithExpression("summary == $summary", {
            summary: "this is a test calendar for Dr No."
    });


    var calendarQuery = DataQuery.withTypeAndCriteria(Calendar,calendarCriteria);
    return mainService.fetchData(calendarQuery)
    .then(function (fetchResult) {
        //if found, we delete them.
        var i, countI, iPerson;

        for(i=0, countI = fetchResult.length;(i<countI);i++) {
            mainService.deleteDataObject(fetchResult[i]);
        }
        return mainService.saveChanges();

        return Promise.resolve(fetchedCalendar[0]);
    }, function(error) {
        if(error.message.indexOf('"phront.Calendar" does not exist') !== -1) {
            //We need to find a way expose the creation of a object descriptor's storage
            //to the main data service.
            var phrontClientService = mainService.childServices[0];
            return Promise.all([
                phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Event)),
                phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Calendar))
            ]);
        }
        else {
            return Promise.reject(error);
        }
    })
    .then(function (resultResults) {
        //Now clean/reset and storage created, create it:
        var attendeeOne, attendeeTwo;

        calendar = mainService.createDataObject(Calendar);
        calendar.summary = "this is a test calendar for Dr No.";
        calendar.description = "this is the description of a test calendar for Dr No.";
        calendar.location = "San Jose";
        calendar.timeZone = "America/Los_Angeles";

        event = mainService.createDataObject(Event);
        /*
            We need to implement and test the reverse, adding the event to the calendar, like:
                calendar.events.add(event);
            with the mainService/triggers doing the right thing in term of settin the graph client side and making sure it ends up how it should when data operations are executed.
        */
        event.calendar = calendar;
        event.summary = "Meeting with myself and I";
        event.description = "Trying to figure stuff out";
        event.timeRange = new Range(new Date(2020, 2, 18, 9,0,0), new Date(2020, 2, 18, 10,15,0));

        attendeeOne = new EventAttendee();
        attendeeOne.email = "marchant@mac.com";
        attendeeOne.displayName = "Benoit Marchant (@mac.com)";

        attendeeTwo = new EventAttendee();
        attendeeTwo.email = "benoit@phront.com";
        attendeeTwo.displayName = "Benoit Marchant (@phront.com)";
        attendeeTwo.isOrganizer = true;

        event.attendees = [attendeeOne,attendeeTwo];

        return mainService.saveChanges();
    })
    .then(function (createCompletedOperation) {
        //Fetch to make sure it was created
        return mainService.fetchData(calendarQuery);
    }, function (error) {
        return Promise.reject(error);
    })
    .then(function(result) {
        if(!result || result.length === 0) {
            throw new Error("Create Calendar and event failed");
        } else {
            return result[0];
        }
    }, function (error) {
        return Promise.reject(error);
    })
    .then(function(fetchedCalendar) {
        calendar.description = "this is the description of a test calendar for Dr Yes.";
        return mainService.saveChanges();
    }, function (error) {
        return Promise.reject(error);
    })
    .then(function(result) {
        mainService.deleteDataObject(calendar);
        mainService.deleteDataObject(event);
        return mainService.saveChanges();
    }, function (error) {
        return Promise.reject(error);
    })
    .then(function(saveOperationResult) {
        console.log("done!!");
        return true;
    },function(saveError) {
        console.error(saveError);
        return Promise.reject(saveError);
    });

};
