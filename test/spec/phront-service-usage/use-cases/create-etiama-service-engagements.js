var mainService = require("phront/test/data/client-main.datareel/main.mjson").montageObject,
Criteria = require("montage/core/criteria").Criteria,
DataStream = require("montage/data/service/data-stream").DataStream,
DataQuery = require("montage/data/model/data-query").DataQuery,
Collection = require("phront/data/main.datareel/model/collection").Collection,
Image = require("phront/data/main.datareel/model/image").Image,
Organization = require("phront/data/main.datareel/model/organization").Organization,
PostalAddress = require("phront/data/main.datareel/model/messaging-channel/postal-address").PostalAddress,
Service = require("phront/data/main.datareel/model/service").Service,
ServiceEngagement = require("phront/data/main.datareel/model/service-engagement").ServiceEngagement,
Position = require("phront/data/main.datareel/model/position").Position,
EmploymentPosition = require("phront/data/main.datareel/model/employment-position").EmploymentPosition,
EmploymentPositionStaffing = require("phront/data/main.datareel/model/employment-position-staffing").EmploymentPositionStaffing,
EmploymentPositionRelationship = require("phront/data/main.datareel/model/employment-position-relationship").EmploymentPositionRelationship,
EmploymentType = require("phront/data/main.datareel/model/employment-type").EmploymentType,
Role = require("phront/data/main.datareel/model/role").Role,
ContactInformation = require("phront/data/main.datareel/model/contact-information").ContactInformation,
Calendar = require("phront/data/main.datareel/model/calendar").Calendar,
CalendarDate = require("montage/core/date/calendar-date").CalendarDate,
Range = require("montage/core/range").Range,
Event = require("phront/data/main.datareel/model/event").Event,
Person = require("phront/data/main.datareel/model/person").Person,
PersonName = require("phront/data/main.datareel/model/person-name").PersonName,
ProductVariant = require("phront/data/main.datareel/model/product-variant").ProductVariant,
Position =  require("montage-geo/logic/model/position").Position,
eventOrganizerRoleInstance,
eventAttendeeRoleInstance,
patientRoleInstance;

function createEventRoleWithNameAndTags(name, tags) {
    var role = mainService.createDataObject(Role);

    role.name = name;
    if(tags) role.tags = tags;

    return mainService.saveChanges().then(function(operation) {
        return role;
    });
};

function eventWithNameAndTags(name, tags) {
    /*
        Role name sample:
        "{"en":{"*":"organizer","CA":"organizeur"},"fr":{"*":"organisateur","CI":"l’organisateur","PF":"organisateur"}}"
    */
   var criteria = new Criteria().initWithExpression("name[$language][$region] == $.name", {
        name: name["en"]["*"],
        language: "en",
        region: "*"
    });
    var query = DataQuery.withTypeAndCriteria(Role, criteria);

    return mainService.fetchData(query)
    .then(function(result) {
        if(!result || result.length === 0) {
            return createEventRoleWithNameAndTags(name, tags);
        } else {
            return result[0];
        }
    }, function(error) {
            if(error.message.indexOf('"phront.Role" does not exist') !== -1) {
                //We need to find a way expose the creation of a object descriptor's storage
                //to the main data service.
                var phrontClientService = mainService.childServices[0];
                return Promise.all([
                    phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Role))
                ]).then(function() {
                    return createOccupationalPhysicianRole();
                });
            }
            else {
                return Promise.reject(error);
            }
    });

};

function eventOrganizerRole() {
    return eventWithNameAndTags({
        "fr": {
            "*":"Organisateur"
        },
        "en": {
            "*":"Organizer"
        }
    }, {
        "fr": {
            "*":["Rendez-vous","Meeting","Reunion","Session de travail"]
        },
        "en": {
            "*":["Appointment","Meeting","Work Session"]
        }
    }
    );
};

function eventAttendeeRole() {
    return eventWithNameAndTags({
        "fr": {
            "*":"Participant"
        },
        "en": {
            "*":"Attendee"
        }
    }, {
        "fr": {
            "*":["Rendez-vous","Meeting","Reunion","Session de travail"]
        },
        "en": {
            "*":["Appointment","Meeting","Work Session"]
        }
    }
    );
};

function patientRole() {
    return eventWithNameAndTags({
        "fr": {
            "*":"Patient"
        },
        "en": {
            "*":"Patient"
        }
    }
    );
};



exports.createTestServiceEngagementsForDoctorsAndOrganizationServices = function createTestServiceEngagementsForDoctorsAndOrganizationServices(doctors, organization, services, startDate) {

    if(!startDate) {
        startDate = new Date();
    }

    //Make sure we have doctors' calendars, so we get their employmentHistory
    var i, countI, iDoctor,
        employmentHistoryPrommises = [];
    for(i=0, countI = doctors.length;(i<countI); i++) {
        iDoctor = doctors[i];
        employmentHistoryPrommises.push(mainService.getObjectProperties(iDoctor, "employmentHistory"));
    }

    Promise.all(employmentHistoryPrommises)
    .then(function() {

        return Promise.all(eventOrganizerRole(), eventAttendeeRole(), patientRole());
    })
    .then(function(roles) {
        //Cache it:
        eventOrganizerRoleInstance = roles[0];
        eventAttendeeRoleInstance = roles[1];
        patientRoleInstance = roles[2];

        var iService, variantPromises = [];
        for(i=0, countI = services.length;(i<countI); i++) {
            iService = services[i];
            variantPromises.push(mainService.getObjectProperties(iService, "variants"));
        }

        return Promise.all(variantPromises);
    })
    .then(function() {
        //Need random persons to create the patients, so we fetch all we have for now
        var personQuery = DataQuery.withTypeAndCriteria(Person);
        return mainService.fetchData(personQuery);
    })
    .then(function (persons) {
        //Make sure we have persons' calendars
        var i, countI, iPerson,
            calendarPrommises = [];
        for(i=0, countI = persons.length;(i<countI); i++) {
            iPerson = persons[i];
            calendarPrommises.push(mainService.getObjectProperties(iPerson, "calendars"));
        }
        return Promise.all(variantPromises)
        .then(function() {
            return persons;
        });
    })
    .then(function(persons) {
        var tahitiTimeZone =  TimeZone.withIdentifier("Pacific/Tahiti"),
            systemTimeZone = TimeZone.systemTimeZone,
            calendarStartDate = startDate.calendarDateInTimeZone(tahitiTimeZone),
            year = calendarStartDate.getFullYear(),
            month = calendarStartDate.getMonth(),
            day = calendarStartDate.getDate(),
            //Set calendarEndDate 2 months ahead
            calendarEndDate = calendarStartDate.calendarDateByAdjustingComponentValues(0,2),
            scheduleTimeRange = Range(calendarStartDate, calendarEndDate, "[]"),

            //We put the doctors there so we don't book them.
            bookedPersons = new Set(doctors),
            doctorSchedulePromises = [],
            i, countI;

        /* Now we have
            - the organization
            - doctors,
            - their calendar (employmentHistory.map{calendars}.0
            - services and their variants
        */


        //First Loop on each doctor:
        for(i=0, countI = doctors.length;(i<countI); i++) {
            iDoctor = doctors[i];
            scheduleDoctorAppointments(iDoctor, persons, bookedPersons, services, scheduleTimeRange)
        }

        return true;
    });


};

function isTahitiWorkDay(currentDay) {
    var dayOfWeek = currentDay.dayOfWeek(CalendarDate.MONDAY);
    //If Saturday or Sunday
    if(dayOfWeek ===  6 || dayOfWeek === 7) {
        return false;
    } else {
        return true;
    }
}


function scheduleDoctorAppointments(iDoctor, persons, bookedPersons, services, scheduleTimeRange) {

    /*
        Horaires Sistra:

        du lundi au jeudi : 7:00 – 12:30 / 13:00 - 16:00
        le vendredi 7:00 – 12:30 / 13:00 - 15:00
    */
    var i=0, countI = 30,
    j, countJ,
    currentDay = scheduleTimeRange.begin,
    timeZone = currentDay.timeZone,
    morningOfficeHourBegin = new CalendarDate({ year: 0, month: 0, day: 0,  hour: 7, minute: 0, second: 0, isDate: false, zone: timeZone}),
    morningOfficeHourEnd = new CalendarDate({ year: 0, month: 0, day: 0,  hour: 12, minute: 30, second: 0, isDate: false, zone: timeZone}),
    afternoonOfficeHourBegin = new CalendarDate({ year: 0, month: 0, day: 0,  hour: 13, minute: 0, second: 0, isDate: false, zone: timeZone}),
    mondayToThursdayAfternoonOfficeHourEnd = new CalendarDate({ year: 0, month: 0, day: 0,  hour: 16, minute: 0, second: 0, isDate: false, zone: timeZone}),
    fridayAfternoonOfficeHourEnd = new CalendarDate({ year: 0, month: 0, day: 0,  hour: 15, minute: 0, second: 0, isDate: false, zone: timeZone}),
    morningOfficeHours = new Range(morningOfficeHourBegin,morningOfficeHourEnd),
    afternoonOfficeHours,
    mondayToThursdayAfternoonOfficeHours = new Range(morningOfficeHourBegin,mondayToThursdayAfternoonOfficeHourEnd),
    fridayAfternoonOfficeHours = new Range(morningOfficeHourBegin,fridayAfternoonOfficeHourEnd),
    randomService,
    randomServiceDuration,
    currentEventTimeBegin,
    currentScheduledTimeRange,
    randomPerson;

   while(scheduleTimeRange.contains(currentDay)) {
       //Test if the day match office hours:
        if(!isTahitiWorkDay(currentDay)) continue;

        //Adjust office hours to currentDay:
        morningOfficeHours.begin.setComponentValues(currentDay.year, currentDay.month-1,currentDay.day);
        morningOfficeHours.end.setComponentValues(currentDay.year, currentDay.month-1,currentDay.day);

        //Friday
        if(currentDay.dayOfWeek(CalendarDate.MONDAY) === 5) {
            fridayAfternoonOfficeHours.begin.setComponentValues(currentDay.year, currentDay.month-1,currentDay.day);
            fridayAfternoonOfficeHours.end.setComponentValues(currentDay.year, currentDay.month-1,currentDay.day);
            afternoonOfficeHours = fridayAfternoonOfficeHours;
        } else {
            //Monday-Thursday
            mondayToThursdayAfternoonOfficeHours.begin.setComponentValues(currentDay.year, currentDay.month-1,currentDay.day);
            mondayToThursdayAfternoonOfficeHours.end.setComponentValues(currentDay.year, currentDay.month-1,currentDay.day);
            afternoonOfficeHours = mondayToThursdayAfternoonOfficeHours;
        }


        //We scheduling morning:
        _scheduleDoctorAppointmentsInOfficeHours(aDoctor, persons, bookedPersons, services, morningOfficeHours)

        //We scheduling afternoon:
        _scheduleDoctorAppointmentsInOfficeHours(aDoctor, persons, bookedPersons, services, afternoonOfficeHours)
   }


};

function _scheduleDoctorAppointmentsInOfficeHours(aDoctor, persons, bookedPersons, services, officeHoursTimeRange) {
    var currentEventTimeBegin = officeHoursTimeRange.begin.clone(),
    currentScheduledTimeRangeBegin,
    randomService,
    randomServiceDurationMinutes,
    currentScheduledTimeRangeEnd,
    currentScheduledTimeRange,
    randomPerson,
    aServiceEngagement,
    aDoctorEvent,
    aPatientCalendar,
    aPatientEvent;

    do {
        currentScheduledTimeRangeBegin = currentEventTimeBegin.clone();

        //We pick a ramdom service
        randomService = services.randomItem();

        //We set the end for the duratio of the service:
        randomServiceDurationMinutes = randomService.duration;
        currentScheduledTimeRangeEnd = currentScheduledTimeRangeBegin.calendarDateByAdjustingComponentValues(0, 0, 0, 0, randomServiceDurationMinutes, 0, 0);

        //We create the range
        currentScheduledTimeRange = new Range(currentScheduledTimeRangeBegin,currentScheduledTimeRangeEnd);

        //And verify we can finish before closing hours:
        if(morningOfficeHours.contains(currentScheduledTimeRange)) {
            /*
                Then we create a ServiceEngagement:
                    ServiceEngagement:
                        - service
                        - serviceVariant
                        - event
            */

            aServiceEngagement = mainService.createDataObject(ServiceEngagement);
            aServiceEngagement.service = randomService;
            //We pick a random variant, though in these there shpuld be 1
            aServiceEngagement.serviceVariant = randomService.variants.randomItem();

            //Now we create the Doctor's event:
            aDoctorEvent = mainService.createDataObject(Event);
            aDoctorEvent.resource = aDoctor;
            aDoctorEvent.calendar = aDoctor.employmentHistory[0].calendars[0];
            aDoctorEvent.scheduledTimeRange = currentScheduledTimeRange;

            //Let's verify that participation is the default aDoctorEvent.participationEmum.Required
            console.log("aDoctorEvent.participation === aDoctorEvent.participationEmum.Required is ", aDoctorEvent.participation === aDoctorEvent.participationEmum.Required);

            aDoctorEvent.participationRoles = [eventOrganizerRoleInstance];
            aDoctorEvent.participationStatus === aDoctorEvent.participationStatusEmum.Accepted;

            //Set the Organizer's event as the one on the serviceEngagement:
            aServiceEngagement.event = aDoctorEvent;


            //We pick a random patient and make sure he hasn't been booked:
            // if(bookedPersons.size === persons + )
            // do {
                randomPerson = persons.randomItem();
            // } while(!bookedPersons.has(randomPerson));


            //Now we create the Doctor's event:
            aPatientEvent = mainService.createDataObject(Event);
            aPatientEvent.resource = randomPerson;
            if(!randomPerson.calendars || randomPerson.calendars.length === 0) {
                aPatientCalendar = mainService.createDataObject(Calendar);
                randomPerson.calendars = [aPatientCalendar];

                //WARNING: check if we still need to also do:
                if(!aPatientCalendar.owner || aPatientCalendar.owner !== randomPerson) {
                    aPatientCalendar.owner = randomPerson;
                }

            } else {
                aPatientCalendar = randomPerson.calendars[0];
            }
            aPatientEvent.calendar = aPatientCalendar;
            aPatientEvent.scheduledTimeRange = currentScheduledTimeRange;

            //Let's verify that participation is the default aDoctorEvent.participationEmum.Required
            console.log("aPatientEvent.participation === aPatientEvent.participationEmum.Required is ", aPatientEvent.participation === aPatientEvent.participationEmum.Required);

            aPatientEvent.participationRoles = [
                eventAttendeeRoleInstance,
                patientRoleInstance
            ];
            aPatientEvent.participationStatus === aPatientEvent.participationStatusEmum.Accepted;

            bookedPersons.add(randomPerson);

        }

        currentEventTimeBegin.takeComponentValuesFromCalendarDate(currentScheduledTimeRange.end);

    } while(morningOfficeHours.contains(currentEventTimeBegin))



}
