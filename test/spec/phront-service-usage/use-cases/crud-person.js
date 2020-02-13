var mainService = require("phront/test/data/client-main.datareel/main.mjson").montageObject,
Criteria = require("montage/core/criteria").Criteria,
DataStream = require("montage/data/service/data-stream").DataStream,
DataQuery = require("montage/data/model/data-query").DataQuery,
Collection = require("phront/data/main.datareel/model/collection").Collection,
Image = require("phront/data/main.datareel/model/image").Image,
Organization = require("phront/data/main.datareel/model/organization").Organization,
Address = require("phront/data/main.datareel/model/address").Address,
Service = require("phront/data/main.datareel/model/service").Service,
Person = require("phront/data/main.datareel/model/person").Person;



exports.crudPerson = function() {

var person = mainService.createDataObject(Person),
                userIdentity;

    //userIdentity = this.application.user;

    person.firstName = "Steve";
    person.lastName = "Jobs";
    person.email = "steve@apple.com";
    // person.image = null;
    // person.addresses = [];
    // person.orders = [];
    // person.tags = [];
    // person.userIdentities = [userIdentity];
    // person.employerRelationships = [];
    return mainService.saveChanges()
    .then(function (createCompletedOperation) {
        //Fetch/create SISTRA
        var personCriteria = new Criteria().initWithExpression("firstName == $firstName && lastName == $lastName", {
            firstName: "Steve",
            lastName: "Jobs"
        });

        console.log("personCriteria.evaluate(person) is "+ personCriteria.evaluate(person));

        var personQuery = DataQuery.withTypeAndCriteria(Person, personCriteria);
        return mainService.fetchData(personQuery);
    }, function (error) {
        Promise.reject(error);
    })
    .then(function(result) {
        if(!result || result.length === 0) {
            throw new Error("Create Person failed");
        } else {
            return result[0];
        }
    }, function (error) {
        Promise.reject(error);
    })
    .then(function(fetchedPerson) {
        person.phone = "+1 650 849 4538";
        return mainService.saveChanges();
    }, function (error) {
        Promise.reject(error);
    })
    .then(function(result) {
        return mainService.deleteDataObject(person);
    }, function (error) {
        Promise.reject(error);
    })
    .then(function(saveOperationResult) {
        console.log("done!!");
        return true;
    },function(saveError) {
        console.error(saveError);
        return saveError;
    });

};
