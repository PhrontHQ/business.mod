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
patientRoleInstance,
TimeZone = require("montage/core/date/time-zone").TimeZone;

function createEventRoleWithNameAndTags(name, tags, locales) {
    var role = mainService.createDataObject(Role);

    role.locales = locales;

    role.name = name;
    if(tags) role.tags = tags;

    return mainService.saveChanges().then(function(operation) {
        /*
            When just created, the role's name might be a object if there were more than 1 locale in locales. We don't have yet the logic to reset

            role.locales = [locales[0]];

            Which should internally do what we want without considering it a change at the DataTrigger level. the easiest for now might be to re-fetch it :-(
        */
       //return role;
       return eventRoleWithNameAndTags(name, tags, locales);
    });
};

function eventRoleWithNameAndTags(name, tags, locales) {
    /*
        Role name sample:
        "{"en":{"*":"organizer","CA":"organizeur"},"fr":{"*":"organisateur","CI":"l’organisateur","PF":"organisateur"}}"
    */

   var firstLocale = locales[0],
        localizedNameEntry = name[firstLocale.language],
        nameValue = localizedNameEntry && (localizedNameEntry[firstLocale.region] || localizedNameEntry["*"]),
        criteria;

    if(!nameValue) {
        throw "Can't find an event role without a name";
    }

    criteria = new Criteria().initWithExpression("name == $.name", {
        name: nameValue
    });

    var query = DataQuery.withTypeAndCriteria(Role, criteria);

    return mainService.fetchData(query)
    .then(function(result) {
        if(!result || result.length === 0) {
            return createEventRoleWithNameAndTags(name, tags, locales);
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
                    return createEventRoleWithNameAndTags(name, tags, locales);
                });
            }
            else {
                return Promise.reject(error);
            }
    });

};

function eventOrganizerRole(locales) {
    return eventRoleWithNameAndTags({
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
    },locales
    );
};

function eventAttendeeRole(locales) {
    return eventRoleWithNameAndTags({
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
    },locales
    );
};

function patientRole(locales) {
    return eventRoleWithNameAndTags({
        "fr": {
            "*":"Patient"
        },
        "en": {
            "*":"Patient"
        }
    },null, locales
    );
};



exports.createTestServiceEngagementsForDoctorsAndOrganizationServices = function createTestServiceEngagementsForDoctorsAndOrganizationServices(doctors, organization, services, startDate, locales) {

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

    return Promise.all(employmentHistoryPrommises)
    .then(function() {

        return Promise.all([eventOrganizerRole(locales), eventAttendeeRole(locales), patientRole(locales)]);
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
    .then(function(variants) {
        //Need random persons to create the patients, so we fetch all we have for now
        var personQuery = DataQuery.withTypeAndCriteria(Person);
        return mainService.fetchData(personQuery);
    })
    .then(function (persons) {
        //Make sure we have persons' calendars
        var i, countI, iPerson,
            calendarPromises = [];
        for(i=0, countI = persons.length;(i<countI); i++) {
            iPerson = persons[i];
            calendarPromises.push(mainService.getObjectProperties(iPerson, "calendars"));
        }
        return Promise.all(calendarPromises)
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
    })
    .then(function() {
        return mainService.saveChanges();
    })
    .then(function(createCompletedOperation) {
        return true;
    },function(error) {
        console.error(error);
        return Promise.reject(error);
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


function scheduleDoctorAppointments(aDoctor, persons, bookedPersons, services, scheduleTimeRange) {

    /*
        Horaires Sistra:

        du lundi au jeudi : 7:00 – 12:30 / 13:00 - 16:00
        le vendredi 7:00 – 12:30 / 13:00 - 15:00
    */
    var i=0, countI = 30,
    j, countJ,
    currentDay = scheduleTimeRange.begin.clone(),
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
        if(isTahitiWorkDay(currentDay)) {

            //Adjust office hours to currentDay:
            morningOfficeHours.begin.setComponentValues(currentDay.year, currentDay.month,currentDay.day);
            morningOfficeHours.end.setComponentValues(currentDay.year, currentDay.month,currentDay.day);

            //Friday
            if(currentDay.dayOfWeek(CalendarDate.MONDAY) === 5) {
                fridayAfternoonOfficeHours.begin.setComponentValues(currentDay.year, currentDay.month,currentDay.day);
                fridayAfternoonOfficeHours.end.setComponentValues(currentDay.year, currentDay.month,currentDay.day);
                afternoonOfficeHours = fridayAfternoonOfficeHours;
            } else {
                //Monday-Thursday
                mondayToThursdayAfternoonOfficeHours.begin.setComponentValues(currentDay.year, currentDay.month,currentDay.day);
                mondayToThursdayAfternoonOfficeHours.end.setComponentValues(currentDay.year, currentDay.month,currentDay.day);
                afternoonOfficeHours = mondayToThursdayAfternoonOfficeHours;
            }


            //We scheduling morning:
            _scheduleDoctorAppointmentsInOfficeHours(aDoctor, persons, bookedPersons, services, morningOfficeHours)

            //We scheduling afternoon:
            _scheduleDoctorAppointmentsInOfficeHours(aDoctor, persons, bookedPersons, services, afternoonOfficeHours)
        }

        //Increment the day:
        currentDay.adjustComponentValues(0, 0, 1);

   }


};

function _scheduleDoctorAppointmentsInOfficeHours(aDoctor, persons, bookedPersons, services, officeHoursTimeRange) {
    var currentEventTimeBegin = officeHoursTimeRange.begin.clone(),
    currentScheduledTimeRangeBegin,
    randomService,
    randomServiceVariant,
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
        //We pick a random variant, though in these there shpuld be 1
        randomServiceVariant = randomService.variants.randomItem();

        //We set the end using the duration of the variant:
        var duration = randomServiceVariant.duration;
        currentScheduledTimeRangeEnd = currentScheduledTimeRangeBegin.calendarDateByAdjustingComponentValues(0, 0, 0, 0, 0, duration);
        //We create the range
        currentScheduledTimeRange = new Range(currentScheduledTimeRangeBegin,currentScheduledTimeRangeEnd);

        //And verify we can finish before closing hours:
        if(officeHoursTimeRange.contains(currentScheduledTimeRange)) {
            /*
                Then we create a ServiceEngagement:
                    ServiceEngagement:
                        - service
                        - serviceVariant
                        - event
            */

            aServiceEngagement = mainService.createDataObject(ServiceEngagement);
            aServiceEngagement.service = randomService;
            aServiceEngagement.serviceVariant = randomServiceVariant;



            //Now we create the Doctor's event:
            aDoctorEvent = mainService.createDataObject(Event);
            aDoctorEvent.participatingParty = aDoctor;
            aDoctorEvent.calendar = aDoctor.employmentHistory[0].calendars[0];
            aDoctorEvent.scheduledTimeRange = currentScheduledTimeRange;

            //Let's verify that participation is the default aDoctorEvent.participationEmum.Required
            //console.log("aDoctorEvent.participation === Event.participationEmum.Required is ", aDoctorEvent.participation === Event.participationEmum.Required);
            aDoctorEvent.participation = Event.participationEmum.Required;
            aDoctorEvent.participationRoles = [eventOrganizerRoleInstance];
            aDoctorEvent.participationStatus === Event.participationStatusEmum.Accepted;

            //Set the Organizer's event as the one on the serviceEngagement:
            aServiceEngagement.event = aDoctorEvent;


            //We pick a random patient and make sure he hasn't been booked:
            // if(bookedPersons.size === persons + )
            // do {
                randomPerson = persons.randomItem();
            // } while(!bookedPersons.has(randomPerson));


            //Now we create the Patient's event:
            aPatientEvent = mainService.createDataObject(Event);

            //Now we linke the Patient's event to the doctor's which is the root/organizer one:
            aPatientEvent.parent = aDoctorEvent;
            aPatientEvent.participatingParty = randomPerson;
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
            //console.log("aPatientEvent.participation === Event.participationEmum.Required is ", aPatientEvent.participation === Event.participationEmum.Required);
            aPatientEvent.participation = Event.participationEmum.Required;
            aPatientEvent.participationRoles = [
                eventAttendeeRoleInstance,
                patientRoleInstance
            ];
            aPatientEvent.participationStatus = Event.participationStatusEmum.Accepted;

            bookedPersons.add(randomPerson);

        }

        currentEventTimeBegin.takeComponentValuesFromCalendarDate(currentScheduledTimeRange.end);

    } while(officeHoursTimeRange.contains(currentEventTimeBegin))



}
