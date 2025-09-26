var mainService = require("business.mod/test/data/client-main.mod/main.mjson").montageObject,
    Locale = require("mod/core/locale").Locale,
    MontageCalendar = require("mod/core/date/calendar").Calendar,
    Promise = require("mod/core/promise").Promise,
    Criteria = require("mod/core/criteria").Criteria,
    DataStream = require("mod/data/service/data-stream").DataStream,
    DataOperation = require("mod/data/service/data-operation").DataOperation,
    DataQuery = require("mod/data/model/data-query").DataQuery,
    Collection = require("business.mod/data/model/collection").Collection,
    Image = require("business.mod/data/model/image").Image,
    Organization = require("business.mod/data/model/party/organization").Organization,
    PostalAddress = require("mod/data/model/messaging-channel/postal-address").PostalAddress,
    PhoneNumber = require("business.mod/data/model/messaging-channel/phone-number").PhoneNumber,
    Service = require("business.mod/data/model/service").Service,
    ServiceEngagement = require("business.mod/data/model/service-engagement").ServiceEngagement,
    Position = require("business.mod/data/model/position").Position,
    EmploymentPosition = require("business.mod/data/model/employment-position").EmploymentPosition,
    EmploymentPositionStaffing = require("business.mod/data/model/employment-position-staffing").EmploymentPositionStaffing,
    EmploymentPositionRelationship = require("business.mod/data/model/employment-position-relationship").EmploymentPositionRelationship,
    EmploymentType = require("business.mod/data/model/employment-type").EmploymentType,
    Role = require("business.mod/data/model/role").Role,
    ContactInformation = require("business.mod/data/model/contact-information").ContactInformation,
    Calendar = require("business.mod/data/model/calendar").Calendar,
    Event = require("business.mod/data/model/event").Event,
    Person = require("business.mod/data/model/person").Person,
    PersonName = require("business.mod/data/model/person-name").PersonName,
    ProductVariant = require("business.mod/data/model/product-variant").ProductVariant,
    GeoPosition =  require("mod/data/model/geo/position").Position,
    GeoPoint =  require("mod/data/model/geo/point").Point,
    GeoProjection = require("geo.mod/logic/model/projection").Projection,
    B2CCustomerSupplierRelationship = require("business.mod/data/model/b-2-c-customer-supplier-relationship").B2CCustomerSupplierRelationship,
    B2BCustomerSupplierRelationship = require("business.mod/data/model/b-2-b-customer-supplier-relationship").B2BCustomerSupplierRelationship,

    defaultProjection = GeoProjection.forSrid("4326"),
    createTestServiceEngagementsForDoctorsAndOrganizationServices = require("./create-service-engagements").createTestServiceEngagementsForDoctorsAndOrganizationServices,

    systemCalendar = MontageCalendar.withIdentifier("gregory"),

    //Set default systemLocale that the DataService will pickup
    systemLocale = Locale.systemLocale = Locale.withIdentifier("fr", {
        calendar: systemCalendar,
        numberingSystem: "latn"
    }),
    frenchLocale = systemLocale,
    englishLocale = Locale.withIdentifier("en", {
        calendar: systemCalendar,
        numberingSystem: "latn"
    }),
    Range = require("mod/core/range").Range;


function createFullTimeEmployeeEmploymentType() {
    var cdiEmploymentType = mainService.createDataObject(EmploymentType);
    cdiEmploymentType.name = "Contrat à durée indéterminée";
    return mainService.saveChanges().then(function(operation) {
        if(operation.type !== DataOperation.Type.CommitTransactionCompletedOperation) {
            return cdiEmploymentType;
        } else {
            throw operation.type;
        }
    });
}

var fullTimeEmployeeEmploymentTypePromise;
function fullTimeEmployeeEmploymentType() {

    if(!fullTimeEmployeeEmploymentTypePromise) {
        fullTimeEmployeeEmploymentTypePromise = new Promise(function(resolve, reject) {

            //Localization not ready, we'll have to re-visit that when it is, or just have diffent ones and specify the countries they're valid in
            var criteria = new Criteria().initWithExpression("name == $name", {
                name: "Contrat à durée indéterminée" //This would be a "Full-time Employee" in the  US.
            });
            var query = DataQuery.withTypeAndCriteria(EmploymentType, criteria);
            var cdiEmploymentType;

            mainService.fetchData(query)
            .then(function(result) {
                if(!result || result.length === 0) {
                    createFullTimeEmployeeEmploymentType()
                    .then(function(result) {
                        resolve(result);
                    });
                } else {
                    resolve(result[0]);
                }
            }, function(error) {
                    if(error.message.indexOf('"phront.EmploymentType" does not exist') !== -1) {
                        //We need to find a way expose the creation of a object descriptor's storage
                        //to the main data service.
                        var phrontClientService = mainService.childServices[0];
                        Promise.all([
                            phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(EmploymentType))
                        ]).then(function() {
                            return createFullTimeEmployeeEmploymentType()
                            .then(function(result) {
                                resolve(result[0]);
                            });
                        });
                    }
                    else {
                        reject(error);
                    }
            });

        });
    }
    return fullTimeEmployeeEmploymentTypePromise;
}



function createOccupationalPhysicianRole() {
    var role = mainService.createDataObject(Role);

    //Set the locales property on the role so we know we should expect an object structure.
    //It might be worth setting the type of this object to be something like a new LoalizationDictionary
    //rather than just an anonymous object
    role.locales = [frenchLocale,englishLocale];

    role.name = {
        "fr": {
            "*":"Médecin du travail"
        },
        "en": {
            "*":"Occupational Physician"
        }
    };
    role.tags = {
        "fr": {
            "*":["Docteur","Médecin","Santé","Prévention","Travail"]
        },
        "en": {
            "*":["Doctor","Physician","Health Care","Prevention","Occupational"]
        }
    };

    return mainService.saveChanges().then(function(operation) {
        return role;
    });
}

var occupationalPhysicianRolePromise;
function occupationalPhysicianRole() {

    if(!occupationalPhysicianRolePromise) {
        occupationalPhysicianRolePromise = new Promise(function(resolve, reject) {
            /*
                Role name sample:
                "{"en":{"*":"organizer","CA":"organizeur"},"fr":{"*":"organisateur","CI":"l’organisateur","PF":"organisateur"}}"
            */
            // var criteria = new Criteria().initWithExpression("name[$language][$region] == $.name", {
            //     name: "Médecin du travail",
            //     language: "fr",
            //     region: "*"
            // });
            //This is a localizable proeprty, the framework takes care of building the rigth criteria
            //which here is set to fr-FR
            var criteria = new Criteria().initWithExpression("name == $.name", {
                name: "Médecin du travail"
            }),
                query = DataQuery.withTypeAndCriteria(Role, criteria);

            mainService.fetchData(query)
            .then(function(result) {
                if(!result || result.length === 0) {
                    createOccupationalPhysicianRole()
                    .then(function(result) {
                        resolve(result);
                    });
                } else {
                    resolve(result[0]);
                }
            }, function(error) {
                    if(error.message.indexOf('"phront.Role" does not exist') !== -1) {
                        //We need to find a way expose the creation of a object descriptor's storage
                        //to the main data service.
                        var phrontClientService = mainService.childServices[0];
                        Promise.all([
                            phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Role))
                        ]).then(function() {
                            return createOccupationalPhysicianRole().then(function(result) {
                                resolve(result[0]);
                            });
                        });
                    }
                    else {
                        reject(error);
                    }
            });

        });
    }

    return occupationalPhysicianRolePromise;

}

/*
https://www.thebalancecareers.com/what-is-a-medical-secretary-526043#medical-secretary-duties--responsibilities
*/
function createMedicalSecretaryRole() {
    var role = mainService.createDataObject(Role);
    role.locales = [frenchLocale,englishLocale];

    role.name = {
        "fr": {
            "*": "Secrétaire médicale"
        },
        "en": {
            "*": "Medical Secretary"
        }
    };
    role.tags = {
        "fr": {
            "*":["Docteur","Médecin","Santé","Cabinet Médical","rendez-vous","agenda","appels téléphoniques","messages","assurances","mutuelles","facture","courier"]
        },
        "en": {
            "*":["Doctor","Physician","Health Care","Medical Office","Schedule","phone call","messages","appointments","insurance","invoice","mail"]
        }
    };

    return mainService.saveChanges().then(function(operation) {
        return role;
    });
}

var medicalSecretaryRolePromise;
function medicalSecretaryRole() {
    if(!medicalSecretaryRolePromise) {
        medicalSecretaryRolePromise = new Promise(function(resolve, reject) {

            //"Secrétaire médicale"
            var criteria = new Criteria().initWithExpression("name == $name", {
                name: "Secrétaire médicale"
            });
            var query = DataQuery.withTypeAndCriteria(Role, criteria);

            mainService.fetchData(query)
            .then(function(result) {
                if(!result || result.length === 0) {
                    createMedicalSecretaryRole()
                    .then(function(result) {
                        resolve(result);
                    });

                } else {
                    return resolve(result[0]);
                }
            }, function(error) {
                if(error.message.indexOf('"phront.EmploymentType" does not exist') !== -1) {
                    //We need to find a way expose the creation of a object descriptor's storage
                    //to the main data service.
                    var phrontClientService = mainService.childServices[0];
                    Promise.all([
                        phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Role))
                    ]).then(function() {
                        createMedicalSecretaryRole()
                        .then(function(result) {
                            resolve(result[0]);
                        });

                    });
                }
                else {
                    return reject(error);
                }
            });
        });
    }
    return medicalSecretaryRolePromise;

}


function createAssistantRole() {
    var role = mainService.createDataObject(Role);

    //Set the locales property on the role so we know we should expect an object structure.
    //It might be worth setting the type of this object to be something like a new LoalizationDictionary
    //rather than just an anonymous object
    role.locales = [frenchLocale,englishLocale];

    role.name = {
        "fr": {
            "*":"Assistant(e)"
        },
        "en": {
            "*":"Assistant"
        }
    };

    return mainService.saveChanges().then(function(operation) {
        return role;
    });
}

var assistantRolePromise;
function assistantRole() {

    if(!assistantRolePromise) {
        assistantRolePromise = new Promise(function(resolve, reject) {
            var criteria = new Criteria().initWithExpression("name == $.name", {
                name: "Assistant(e)"
            }),
                query = DataQuery.withTypeAndCriteria(Role, criteria);

            mainService.fetchData(query)
            .then(function(result) {
                if(!result || result.length === 0) {
                    createAssistantRole()
                    .then(function(result) {
                        resolve(result);
                    });
                } else {
                    resolve(result[0]);
                }
            }, function(error) {
                    if(error.message.indexOf('"phront.Role" does not exist') !== -1) {
                        //We need to find a way expose the creation of a object descriptor's storage
                        //to the main data service.
                        var phrontClientService = mainService.childServices[0];
                        Promise.all([
                            phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Role))
                        ]).then(function() {
                            return createAssistantRole().then(function(result) {
                                resolve(result[0]);
                            });
                        });
                    }
                    else {
                        reject(error);
                    }
            });

        });
    }

    return assistantRolePromise;

}

function randomEmploymentPositionStaffingStartDate(start, end) {
    end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}


function fetchPersonWithName(data) {
    /*
        DEBUG QUERY
    */
    return Promise.resolve(null);

    var expression = "";
    for(key in data) {
        if(expression.length) {
            expression += " && ";
        }
        expression += "name."+key+" == $."+ key;
    }

    var criteria = new Criteria().initWithExpression(expression, data),
        query = DataQuery.withTypeAndCriteria(Person, criteria);

    return mainService.fetchData(query);
}


function createDoctorWithData(data) {

    //Before we can start we need a few objects:
    var objectPromises = [],
        cdiEmploymentTypePromise = fullTimeEmployeeEmploymentType(),
        occupationalPhysicianRolePromise = occupationalPhysicianRole(),
        medicalSecretaryRolePromise = medicalSecretaryRole(),
        assistantRolePromise = assistantRole(),
        doctorPromise = fetchPersonWithName({
            givenName: data.doctorGivenName,
            familyName: data.doctorFamilyName,
            namePrefix: "Dr."
        });
        doctorSecretaryPromise = fetchPersonWithName({
            givenName: data.assistantGivenName,
            familyName: data.assistantFamilyName
        });

        objectPromises.push(cdiEmploymentTypePromise);
        objectPromises.push(occupationalPhysicianRolePromise);
        objectPromises.push(medicalSecretaryRolePromise);
        objectPromises.push(assistantRolePromise);
        objectPromises.push(doctorPromise);
        objectPromises.push(doctorSecretaryPromise);


    return Promise.all(objectPromises)
    .then(function(objectPromisesResolved) {

        /*
            Slight improvement, we make sure the Persons exists, assuming that
            Position, EmploymentPosition, EmploymentPositionStaffing, Calendar aand ContactInformation are wiped clean before we run this.

            THIS NEEDS TO CHANGE!!
        */

        var cdiEmploymentType = objectPromisesResolved[0],
            occupationalPhysicianRole = objectPromisesResolved[1],
            medicalSecretaryRole = objectPromisesResolved[2],
            assistantRole = objectPromisesResolved[3],
            organization = data.organization,
            doctor = objectPromisesResolved[4],
            doctorSecretary = objectPromisesResolved[5],
            doctorName,
            //doctorContactInformation = mainService.createDataObject(ContactInformation),
            doctorPosition = mainService.createDataObject(Position),
            doctorEmploymentPosition = mainService.createDataObject(EmploymentPosition),
            doctorEmploymentPositionStaffing = mainService.createDataObject(EmploymentPositionStaffing),
            doctorSecretary,
            doctorSecretaryContactInformation = mainService.createDataObject(ContactInformation),
            doctorSecretaryPosition = mainService.createDataObject(Position),
            doctorSecretaryEmploymentPosition = mainService.createDataObject(EmploymentPosition),
            doctorSecretaryEmploymentPositionStaffing = mainService.createDataObject(EmploymentPositionStaffing),
            doctorSecretaryEmploymentPositionRelationship = mainService.createDataObject(EmploymentPositionRelationship),
            /*
                We'remissing a check that Calendar Table may exists or not
            */
           doctorCalendar,
           doctorSecretaryCalendar;


        if(!doctor) {
            doctor = mainService.createDataObject(Person);
            doctorName = new PersonName();

            //Name
            doctor.name = doctorName;
            doctorName.namePrefix = "Dr.";
            doctorName.givenName = data.doctorGivenName;
            doctorName.familyName = data.doctorFamilyName;
        }

        if(!doctorSecretary) {
            doctorSecretary = mainService.createDataObject(Person);
            doctorSecretaryName = new PersonName();

            //Name
            doctorSecretary.name = doctorSecretaryName;
            doctorSecretaryName.givenName = data.assistantGivenName;
            doctorSecretaryName.familyName = data.assistantFamilyName;
        }

        //Setup the doctor position,
        doctorPosition.name = occupationalPhysicianRole.name;
        doctorPosition.role = occupationalPhysicianRole;

        //employmentPosition
        doctorEmploymentPosition.allowedEmploymentTypes = [cdiEmploymentType];
        doctorEmploymentPosition.employer = organization;
        doctorEmploymentPosition.position = doctorPosition;

        //and positionEmploymentStaffing
        doctorEmploymentPositionStaffing.employmentType = cdiEmploymentType;
        doctorEmploymentPositionStaffing.employmentPosition = doctorEmploymentPosition;
        doctorCalendar = mainService.createDataObject(Calendar);
        doctorEmploymentPositionStaffing.calendars = [doctorCalendar];
        //WARNING: check if we still need to also do:
        if(!doctorCalendar.owner || doctorCalendar.owner !== doctorEmploymentPositionStaffing) {
            doctorCalendar.owner = doctorEmploymentPositionStaffing;
        }


        doctor.employmentHistory = [doctorEmploymentPositionStaffing];
        //Inverse:
        if(doctorEmploymentPositionStaffing.employee !== doctor) {
            //doctorEmploymentPositionStaffing.employee = doctor;
            console.error("Inverse propagation error");
        }

        var someStartDateEarlyBoundary = new Date();
        someStartDateEarlyBoundary.setYear(2001);
        doctorEmploymentPositionStaffing.existenceTimeRange = new Range(randomEmploymentPositionStaffingStartDate(someStartDateEarlyBoundary), null);

        //We don't have personal Contact Information for Doctors
        // doctor.contactInformation = doctorContactInformation;

        //Clone the organization.services to assign it to the doctor
        var organizationServicesClone = organization.services.slice();
        //Add Sistra's services to Doctor's services
        doctor.services = organizationServicesClone;
        //Check Inverse:
        for(var s=0, countS = doctor.services.length,sService;(s<countS); s++) {
            sService = doctor.services[s];
            if(sService.providers.indexOf(doctor) === -1 ) {
                //doctorEmploymentPositionStaffing.employee = doctor;
                console.error("Inverse propagation error");
            }
        }

        //Setup the doctor secretary position
        doctorSecretaryPosition.name = medicalSecretaryRole.name;
        doctorSecretaryPosition.role = medicalSecretaryRole;

        //employmentPosition
        doctorSecretaryEmploymentPosition.allowedEmploymentTypes = [cdiEmploymentType];
        doctorSecretaryEmploymentPosition.employer = organization;
        doctorSecretaryEmploymentPosition.position = doctorSecretaryPosition;

        //and positionEmploymentStaffing
        doctorSecretaryEmploymentPositionStaffing.employmentType = cdiEmploymentType;
        doctorSecretaryEmploymentPositionStaffing.employmentPosition = doctorSecretaryEmploymentPosition;
        doctorSecretaryEmploymentPositionStaffing.employee = doctorSecretary;
        doctorSecretaryEmploymentPositionStaffing.existenceTimeRange = new Range(randomEmploymentPositionStaffingStartDate(someStartDateEarlyBoundary), null);

        //Inverse:
        if(! doctorSecretary.employmentHistory ||  doctorSecretary.employmentHistory[0] !== doctorSecretaryEmploymentPositionStaffing) {
            //doctorSecretary.employmentHistory = [doctorSecretaryEmploymentPositionStaffing];
            console.error("Inverse propagation error");
        }

        doctorSecretaryCalendar = mainService.createDataObject(Calendar);
        doctorSecretaryEmploymentPositionStaffing.calendars = [doctorSecretaryCalendar];
        //WARNING: check if we still need to also do:
        if(!doctorSecretaryCalendar.owner || doctorSecretaryCalendar.owner !== doctorSecretaryEmploymentPositionStaffing) {
            doctorSecretaryCalendar.owner = doctorSecretaryEmploymentPositionStaffing;
        }

        //ContactInformation
        doctorSecretary.contactInformation = doctorSecretaryContactInformation;
        doctorSecretaryContactInformation.emailAddrresses = [data.assistantEmail];
        //TODO:
        //assistantEmail: "dayana.raveino@sistra.pf"


        //setup Doctor and secretary EmploymentPositionRelationship with organization
        doctorSecretaryEmploymentPositionRelationship.firstEmploymentPosition = doctorSecretaryEmploymentPosition;
        //Assistant
        doctorSecretaryEmploymentPositionRelationship.firstEmploymentPositionRelationshipRole = assistantRole;

        doctorSecretaryEmploymentPositionRelationship.secondEmploymentPosition = doctorEmploymentPosition;



        return mainService.saveChanges().then(function(operation) {
            return doctor;
        });

    });

}

function createObjectDescriptorStoreIfMissing(type) {
    var objectDescriptor = mainService.objectDescriptorForType(type),
        query = DataQuery.withTypeAndCriteria(objectDescriptor);

    // console.log("--> Testing if "+objectDescriptor.name+ " table exists");

    query.fetchLimit = 1;

    return mainService.fetchData(query)
    .then(function (result) {
        // console.log("<-- "+objectDescriptor.name+ " table exists");
        return true;
    }, function (error) {
        if((error.message.indexOf('"phront.'+query.type.name+'" does not exist') !== -1)) {
            //We need to find a way expose the creation of a object descriptor's storage
            //to the main data service.
            var phrontClientService = mainService.childServices[0];
            return phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(objectDescriptor))
            .then(function() {
                return true;
            });
        }
        else {
            return Promise.reject(error);
        }
    });

}


exports.createProServices = function() {


    return Promise.all([
        createObjectDescriptorStoreIfMissing(Calendar),
        createObjectDescriptorStoreIfMissing(Event),
        createObjectDescriptorStoreIfMissing(Position),
        createObjectDescriptorStoreIfMissing(EmploymentPosition),
        createObjectDescriptorStoreIfMissing(EmploymentType),
        createObjectDescriptorStoreIfMissing(EmploymentPositionStaffing),
        createObjectDescriptorStoreIfMissing(EmploymentPositionRelationship),
        createObjectDescriptorStoreIfMissing(ContactInformation),
        createObjectDescriptorStoreIfMissing(B2CCustomerSupplierRelationship),
        createObjectDescriptorStoreIfMissing(B2BCustomerSupplierRelationship),
        createObjectDescriptorStoreIfMissing(ServiceEngagement)
    ])
    .then(function() {
        //Fetch/create SISTRA
        var organizationCriteria = new Criteria().initWithExpression("name == $.name", {
            name: "SISTRA"
        });
        var organizationQuery = DataQuery.withTypeAndCriteria(Organization, organizationCriteria);
        var sistraOrganization;

        return mainService.fetchData(organizationQuery)
    })
    .then(function(result) {
        if(!result || result.length === 0) {
            console.log("-> Create SISTRA Organization ");
            sistraOrganization =  mainService.createDataObject(Organization);
            sistraOrganization.name = "SISTRA";

            /* address:
                IMMEUBLE FARHNAM
                A l'angle des rues Clappier et Leboucher
                B.P. 972 – 98713 – PAPEETE
                TAHITI – POLYNÉSIE FRANÇAISE
            */
            var sistraAddress = mainService.createDataObject(PostalAddress),
                sistraPhoneNumber = mainService.createDataObject(PhoneNumber),
                sistraContactInformation = mainService.createDataObject(ContactInformation);


            sistraOrganization.contactInformation = sistraContactInformation;

            sistraPhoneNumber.label = "Acceuil";
            sistraPhoneNumber.countryCode = "689";
            sistraPhoneNumber.nationalNumber = "40501999";

            sistraContactInformation.phoneNumbers = [sistraPhoneNumber];

            sistraAddress.label = "Siège";
            sistraAddress.name = "SISTRA2";
            //    sistraAddress.firstName = jShopifyAddress.firstName;
            //    sistraAddress.lastName = jShopifyAddress.lastName;
            throw "Deal with PostalAddress model change";
            sistraAddress.address1 = "Immeuble FARHNAM, à l'angle des rues Clappier et Leboucher";
            sistraAddress.address2 = "B.P. 972";
            sistraAddress.locality = "PAPEETE";
            //sistraAddress.subLocality = "";
            sistraAddress.primaryPostalCode = "98713";
            throw "Need to fecth Country now";
            sistraAddress.country = "TAHITI – POLYNÉSIE FRANÇAISE";

            //For geodetic coordinates, X is longitude and Y is latitude
            var sistraPosition = GeoPoint.withCoordinates([/* longitude */-149.567452,/* latitude */-17.535409, /* altitude */0] ,defaultProjection);

            sistraAddress.location = sistraPosition;

            sistraContactInformation.postalAddresses = [sistraAddress];


            /*
                NOS HORAIRES
                Du lundi au jeudi : 7:00-12:30 / 13:00-16:00
                Le vendredi : 7:00-12:30 – 13:00-15:00

                Not sure where we should put this. These are events and it could be on a calendar called "Working Hours", and it should taken into account as "available", but reversed to be stored. And that's a recurring event, going to ignore it for now.
            */
           return mainService.saveChanges()
           .then(function(createCompletedOperation) {
                return sistraOrganization;
                //return createCompletedOperation.data;
            },function(error) {
                console.error(error);
            });

        }
        else {
            sistraOrganization = result[0];
            return Promise.resolve(sistraOrganization);
        }

    })
    .then(function(sistraOrganization) {

        //Fetch services:
        var servicesCriteria = new Criteria().initWithExpression("vendor == $vendor", {
            vendor: sistraOrganization
        });
        var servicesQuery = DataQuery.withTypeAndCriteria(Service, servicesCriteria);
        return mainService.fetchData(servicesQuery)
        .then(function(result) {
            var service, variant;

            if(result && result.length > 2) {
                // console.log("Sistra provided services: ",result);
                return sistraOrganization;
            }
            else {
        /*
            Create Services

            Les salariés identifiés comme S.M.R. (ou Surveillance Médicale Renforcée) ont une vsisite médicale par an, les autres, les S.M.O. (surveillance médicale Ordinaire) ont une visite médicale tous les deux ans.

            https://www.sistra.pf/nos-prestations
        */

                //Surveillance Médicale Ordinaire - 20mn
                service = mainService.createDataObject(Service);
                service.vendor = sistraOrganization;
                // service.originId = originId;
                service.title = "Surveillance Médicale Ordinaire";
                service.descriptionHtml = "Les salariés identifiés comme ayant besoin d'une surveillance médicale ordinaire doivent avoir une visite médicale tous les deux ans.";

                variant = mainService.createDataObject(ProductVariant);
                variant.selectedOptions = [
                    {
                        "name": "Durée",
                        "value": "20"
                    }
                ];
                service.variants = [variant];

                // service.descriptionHtml = descriptionHtml;
                //Auto now
                // service.modificationDate = ....;
                //Auto now
                //service.creationDate = ....;
                //service.publicationDate = shopifyProduct.publishedAt;
                //service.tags = shopifyProduct.tags;

                //Surveillance Médicale Renforcée - 40mn
                service = mainService.createDataObject(Service);
                service.vendor = sistraOrganization;
                // service.originId = originId;
                service.title = "Surveillance Médicale Renforcée";
                service.descriptionHtml = `Les salariés identifiés comme ayant besoin d'une surveillance médicale renforcée doivent avoir une visite médicale tous les ans.

                Les S.M.R. sont identifiées par les dispositions réglementaires :
​
                    Article A.4623-20 de l’arrêté 925 CM du 8 juillet 2011, prévoit une surveillance renforcée pour :
                        - Les personnes en situation de handicap ;
                        - Les femmes en état de grossesse ;
                        - Les mères d’un enfant de moins de deux ans ;
                        - Les travailleurs de moins de 18 ans.

                    L'arrêté n° 126 CM du 8 février 2010 <a href="https://03653194-5c47-4e81-8191-bf076c9fd8fa.filesusr.com/ugd/cdd818_86dbf409d3684c77a67e39e0a8ca65e4.pdf">(cliquez ici pour télécharger le document)</a> identifie les travaux faisant l'objet d'une surveillance médicale renforcée par le médecin du travail.`;

                variant = mainService.createDataObject(ProductVariant);
                variant.selectedOptions = [
                    {
                        "name": "Durée",
                        "value": "60"
                    }
                ];
                service.variants = [variant];


                //Surveillance Médicale Ordinaire - 20mn
                service = mainService.createDataObject(Service);
                service.vendor = sistraOrganization;
                // service.originId = originId;
                service.title = "Visite Médicale d'Embauche";
                service.descriptionHtml = "Tout salarié doit passer une visite médicale d'embauche.";
                variant = mainService.createDataObject(ProductVariant);
                variant.selectedOptions = [
                    {
                        "name": "Durée",
                        "value": "20"
                    }
                ];
                service.variants = [variant];

                //Visite Médicale de Reprise - 40mn
                service = mainService.createDataObject(Service);
                service.vendor = sistraOrganization;
                // service.originId = originId;
                service.title = "Visite Médicale de Reprise";
                service.descriptionHtml = `Tout salarié doit passer une visite médicale lors d'une reprsie du travail à la suite:
                    - d'un accident du travail
                    - d'une maladie non professionnelle
                    - d'une maladie professionnelle
                    - d'une maternité`;

                variant = mainService.createDataObject(ProductVariant);
                variant.selectedOptions = [
                    {
                        "name": "Durée",
                        "value": "40"
                    }
                ];
                service.variants = [variant];



                return mainService.saveChanges()
                .then(function(createCompletedOperation) {
                        return sistraOrganization;
                        //return createCompletedOperation.data;
                    },function(error) {
                        console.error(error);
                        return Promise.reject(error);
                    });

            }

        },function(error) {
            console.error(error);
        })
        .then(function(sistraOrganization) {
            return occupationalPhysicianRole()
            .then(function(occupationalPhysicianRole) {

                return mainService.getObjectProperties(sistraOrganization, "services").then(function () {
                    //Now sistraOrganization.services should contain the 3 we just created or fetched.

                    //Get Sistra enployees who are doctors.
                    var sistraDoctorsCriteriaParameters = {
                        organization: sistraOrganization,
                        role: occupationalPhysicianRole,
                        timeRange: Range.fullDayTimeRangeFromDate(new Date())
                        },
                        sistraDoctorsCriteria = new Criteria().initWithExpression("employmentHistory.employmentPosition.employer == $organization && employmentHistory.employmentPosition.position.role == $role && employmentHistory.existenceTimeRange.overlaps($timeRange)", sistraDoctorsCriteriaParameters),
                        sistraDoctorsQuery = DataQuery.withTypeAndCriteria(Person, sistraDoctorsCriteria);

                    //Fetch One Doctor to see if we have them:
                    // var personCriteriaParameters = {
                    //         givenName: "Régis",
                    //         familyName: "Dacquin"
                    //     },
                    //     personCriteria = new Criteria().initWithExpression("name.givenName == $.givenName && name.familyName == $.familyName", personCriteriaParameters),
                    //     personQuery = DataQuery.withTypeAndCriteria(Person, personCriteria);
                    return mainService.fetchData(sistraDoctorsQuery)
                    .then(function(result) {
                        if(!result || result.length == 0) {
                            var doctorPromises = [],
                                creationData = {
                                    organization: sistraOrganization,
                                    doctorGivenName: "Régis",
                                    doctorFamilyName: "Dacquin",
                                    assistantGivenName: "Dayana",
                                    assistantFamilyName: "Raveino",
                                    assistantEmail: "dayana.raveino@sistra.pf"
                                };
                            doctorPromises.push(createDoctorWithData(creationData));

                            creationData = {};
                            creationData.organization = sistraOrganization;
                            creationData.doctorGivenName = "Marion";
                            creationData.doctorFamilyName = "Aufils";
                            creationData.assistantGivenName = "Evalina";
                            creationData.assistantFamilyName = "Teriierooiterai";
                            creationData.assistantEmail = "evalina.maraetefau@sistra.pf";
                            doctorPromises.push(createDoctorWithData(creationData));

                            creationData = {};
                            creationData.organization = sistraOrganization;
                            creationData.doctorGivenName = "Claude";
                            creationData.doctorFamilyName = "Paulet";
                            creationData.assistantGivenName = "Virginia";
                            creationData.assistantFamilyName = "Teissier";
                            creationData.assistantEmail = "virginia.teissier@sistra.pf";
                            doctorPromises.push(createDoctorWithData(creationData));

                            creationData = {};
                            creationData.organization = sistraOrganization;
                            creationData.doctorGivenName = "Francine";
                            creationData.doctorFamilyName = "Oval";
                            creationData.assistantGivenName = "Hamoura";
                            creationData.assistantFamilyName = "Pae";
                            creationData.assistantEmail = "hamoura.pae@sistra.pf";
                            doctorPromises.push(createDoctorWithData(creationData));

                            creationData = {};
                            creationData.organization = sistraOrganization;
                            creationData.doctorGivenName = "Odile";
                            creationData.doctorFamilyName = "Leccia";
                            creationData.assistantGivenName = "Mere";
                            creationData.assistantFamilyName = "Tata";
                            creationData.assistantEmail = "mere.tata@sistra.pf";
                            doctorPromises.push(createDoctorWithData(creationData));

                            //Should resolve to an array of person instances
                            return Promise.all(doctorPromises);

                        } else {
                            return result;
                        }

                    });
                });
            });

        },function(error) {
            console.error(error);
        })
        .then(function(sistraDoctors) {
            return createTestServiceEngagementsForDoctorsAndOrganizationServices(sistraDoctors, sistraOrganization, sistraOrganization.services, new Date(), [frenchLocale,englishLocale]);

        },function(error) {
            console.error(error);
        })
        .then(function() {
            return mainService.saveChanges();
        })
        .then(function(completedOperation) {
            return true;
        },function(error) {
            console.error(error);
            return Promise.reject(error);
        });


    });
}

