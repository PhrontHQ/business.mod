var mainService = require("business.mod/test/data/client-main.mod/main.mjson").montageObject,
Criteria = require("mod/core/criteria").Criteria,
DataStream = require("mod/data/service/data-stream").DataStream,
DataQuery = require("mod/data/model/data-query").DataQuery,
Range = require("mod/core/range").Range,
Service = require("business.mod/data/model/service").Service,
Organization = require("business.mod/data/model/party/organization").Organization,
Event = require("business.mod/data/model/event").Event,
Calendar = require("business.mod/data/model/calendar").Calendar,
EventConferenceData = require("business.mod/data/model/event-conference-data").EventConferenceData,
Person = require("business.mod/data/model/person").Person,
EventSystemDescriptors = [Event,Calendar],
phrontServiceConnectionPromise = require("../phront-service-connection").promise;


describe("Services", function () {
    var tableExists = false,
        calendar,
        event,
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
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 480000;

            //First Verify Table Exists:
            if(tableExists) {
                return Promise.resolve(true);
            }

            return mainService.fetchData(DataQuery.withTypeAndCriteria(Service))
            .then(function (result) {
                console.log("fetched "+result.length+" Services");
                tableExists = true;
                return result;
                // return mainService.fetchData(calendarQuery);
            }, function (error) {
                return Promise.reject(error);
            });
            // .then(function (fetchResult) {
            //     //if found, we delete them.
            //     var i, countI, iCalendar;

            //     /*
            //         TODO Need to add cascade delete to work so when we remove a calendar it removes all its events at the same time.
            //     */

            //     for(i=0, countI = fetchResult.length;(i<countI);i++) {
            //         mainService.deleteDataObject(fetchResult[i]);
            //     }
            //     tableExists = true;
            //     return mainService.saveChanges();

            // }, function(error) {
            //     if(error.message.indexOf('"phront.Calendar" does not exist') !== -1) {
            //         //We need to find a way expose the creation of a object descriptor's storage
            //         //to the main data service.
            //         var phrontClientService = mainService.childServices[0];
            //         return Promise.all([
            //             phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Event)),
            //             phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Calendar))
            //         ])
            //         .then(function() {
            //             tableExists = true;
            //             return true;
            //         });
            //     }
            //     else {
            //         return Promise.reject(error);
            //     }
            // });
        });

        afterEach(function() {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        describe("Fetch Services", function () {

            it("Fetch a service by vendor's address locality", function () {
                var servicesCriteria = new Criteria().initWithExpression("vendors.addresses.locality == $.locality", {
                    locality: "PAPEETE"
                });

                return mainService.fetchData(DataQuery.withTypeAndCriteria(Service,servicesCriteria))
                .then(function(result) {
                    console.log("fetched Services:", result);
                    return result;
                }, function(error) {
                    consoe.error(eror);
                })

            });

            it("Fetch a service by vendor's name", function () {
                var servicesCriteria = new Criteria().initWithExpression("vendors.name == $.name", {
                    name: "SISTRA"
                });

                return mainService.fetchData(DataQuery.withTypeAndCriteria(Service,servicesCriteria))
                .then(function(result) {
                    console.log("fetched Services:", result);
                    return result;
                })

            });


        });

    });

});
