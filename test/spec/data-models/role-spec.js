var mainService = require("business.mod/test/data/client-main.mod/main.mjson").montageObject,
Locale = require("mod/core/locale").Locale,
Calendar = require("mod/core/date/calendar").Calendar,
Criteria = require("mod/core/criteria").Criteria,
DataStream = require("mod/data/service/data-stream").DataStream,
DataQuery = require("mod/data/model/data-query").DataQuery,
Range = require("mod/core/range").Range,
Role = require("mod/data/model/party/role").Role,
Organization = require("business.mod/data/model/party/organization").Organization,
EventConferenceData = require("business.mod/data/model/event-conference-data").EventConferenceData,
Person = require("business.mod/data/model/person").Person,
phrontServiceConnectionPromise = require("../phront-service-connection").promise;


describe("Roles", function () {
    var tableExists = false,
        calendar,
        event,
        roleName = "organisateur",
        eventCriteria = new Criteria().initWithExpression("name == $name", {
            name: roleName
        }),
        systemCalendar = Calendar.withIdentifier("gregory"),


         //Set default Locale.
        systemLocale = Locale.systemLocale = Locale.withIdentifier("fr-PF",{
            calendar: systemCalendar,
            numberingSystem: "latn"
        });



    //Can't do anything until we can talk to the backend:
    beforeEach(function () {
        return phrontServiceConnectionPromise;
    });

    describe("Create, Read, Update, Delete Events", function () {
        var originalTimeout;

        beforeEach(function () {

            return new Promise(function(resolve,reject) {


                originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
                jasmine.DEFAULT_TIMEOUT_INTERVAL = 480000;

                //First Verify Table Exists:
                if(tableExists) {
                    return resolve(true);
                }

                var roleDataQuery = DataQuery.withTypeAndCriteria(Role);
                //roleDataQuery.readExpressions = ["name","description","tags"];

                mainService.fetchData(roleDataQuery)
                .then(function (result) {
                    console.log("fetched "+result.length+" Roles");
                    tableExists = true;
                    resolve(result);
                    // return mainService.fetchData(calendarQuery);
                }, function (error) {
                    if(error.message.indexOf('"phront.Role" does not exist') !== -1) {
                        //We need to find a way expose the creation of a object descriptor's storage
                        //to the main data service.
                        var phrontClientService = mainService.childServices[0];
                        Promise.all([
                            phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Role))
                        ])
                        .then(function() {
                            tableExists = true;
                            resolve(true);
                        },function(error) {
                            console.error(error);
                            reject(error);
                        });
                    }
                    else {
                        reject(error);
                    }
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

        });

        afterEach(function() {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        describe("Fetch and create key roles as needed ", function () {

            it("Fetch | create Organizer", function () {
                /*
                    Ground zero, pushed the whole JSON to have something to work with

                var roleCriteria = new Criteria().initWithExpression("name.en.* == $.en_name", {
                    en_name: "organizer"
                });
                */

                /*
                    The user doesn't need to worry about adding locale consideation to a criteria,
                    it's automatically taken care of by default at the framework level

                */
                var roleCriteria1 = new Criteria().initWithExpression("name == $name", {
                    name: "organisateur"
                });

                /*
                    But what if somehow we'd want a specific instance of a LocalizedString in a different Locale? Like in a page with country names where each name is set in it's native language?
                */
                var roleCriteria2 = new Criteria().initWithExpression("name == $.name and name.locale == $.locale", {
                    name: "organisateur",
                    locale: "fr-PF"
                });

                //Which would become when adding the fallback logic internally:
                var roleCriteria3 = new Criteria().initWithExpression("name[$language][$region] == $.locale or name[$language].* == $.locale", {
                    name: "organisateur",
                    language: "fr",
                    region: "PF"
                });

                var roleDataQuery = DataQuery.withTypeAndCriteria(Role, roleCriteria1);
                // roleDataQuery.readExpressions = ["name","description","tags"];


                return mainService.fetchData(roleDataQuery)
                .then(function(result) {
                    console.log("fetched Role:", result);
                    if(result.length === 0) {

                        /*

                        Ground zero, pushed the whole JSON to have something to work with
                        var organizerRole =  mainService.createDataObject(Role);
                        organizerRole.name = {
                            "en": {
                                "*": "organizer",
                                "CA": "organizeur"
                            },
                            "fr": {
                                "*": "organisateur",
                                "CI": "l’organisateur",
                                "PF": "organisateur"
                            }
                        };
                        organizerRole.description = {
                            "en": {
                                "*": "The person organizing something like an event."
                            },
                            "fr": {
                                "*": "La personne qui organize un événement."
                            }
                        };

                        organizerRole.tags = {
                            "en": {
                                "*": ["event"]
                            },
                            "fr": {
                                "*": ["événement"]
                            }
                        };

                        return mainService.saveChanges()
                        .then(function(createCompletedOperation) {
                                return organizerRole;
                                //return createCompletedOperation.data;
                        },function(error) {
                            console.error(error);
                            return Promise.reject(error);
                        });
                        */




                    } else {
                        expect(result.name).toBe("organisateur");
                    }
                    return result;
                }, function(error) {
                    console.error(eror);
                })

            });


        });

    });

});
