var mainService = require("business-data.mod/test/data/client-main.mod/main.mjson").montageObject,
Criteria = require("mod/core/criteria").Criteria,
DataStream = require("mod/data/service/data-stream").DataStream,
DataQuery = require("mod/data/model/data-query").DataQuery,
Collection = require("business-data.mod/data/model/collection").Collection,
Image = require("business-data.mod/data/model/image").Image,
Organization = require("business-data.mod/data/model/organization").Organization,
PostalAddress = require("business-data.mod/data/model/messaging-channel/postal-address").PostalAddress,
Service = require("business-data.mod/data/model/service").Service,
Person = require("business-data.mod/data/model/person").Person;



exports.crudPerson = function() {
    var person,
        userIdentity,
        personCriteria = new Criteria().initWithExpression("firstName == $firstName && lastName == $lastName", {
        firstName: "Steve",
        lastName: "Jobs"
    });


    var personQuery = DataQuery.withTypeAndCriteria(Person, personCriteria);
    return mainService.fetchData(personQuery)
    .then(function (fetchedPersons) {
        //if found, we delete them.
        var i, countI, iPerson;

        for(i=0, countI = fetchedPersons.length;(i<countI);i++) {
            mainService.deleteDataObject(fetchedPersons[i]);
        }
        return mainService.saveChanges();
    })
    .then(function (resultResults) {
        //Now clean, create it:

        person = mainService.createDataObject(Person);

        //userIdentity = this.application.userIdentity;

        person.firstName = "Steve";
        person.lastName = "Jobs";
        person.email = "steve@apple.com";
        // person.image = null;
        // person.addresses = [];
        // person.orders = [];
        // person.tags = [];
        // person.userIdentities = [userIdentity];
        // person.employerRelationships = [];

        console.log("personCriteria.evaluate(person) is "+ personCriteria.evaluate(person));

        return mainService.saveChanges();
    })
    .then(function (createCompletedOperation) {
        //Fetch to make sure it was created
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
        mainService.deleteDataObject(person);
        return mainService.saveChanges();
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
