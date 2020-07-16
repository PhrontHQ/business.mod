var mainService = require("phront/test/data/client-main.datareel/main.mjson").montageObject,
Promise = require("montage/core/promise").Promise,
Criteria = require("montage/core/criteria").Criteria,
DataStream = require("montage/data/service/data-stream").DataStream,
DataQuery = require("montage/data/model/data-query").DataQuery,
Collection = require("phront/data/main.datareel/model/collection").Collection,
Image = require("phront/data/main.datareel/model/image").Image,
Organization = require("phront/data/main.datareel/model/organization").Organization,
PostalAddress = require("phront/data/main.datareel/model/messaging-channel/postal-address").PostalAddress,
PhoneNumber = require("phront/data/main.datareel/model/messaging-channel/phone-number").PhoneNumber,
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
Event = require("phront/data/main.datareel/model/event").Event,
Person = require("phront/data/main.datareel/model/person").Person,
PersonName = require("phront/data/main.datareel/model/person-name").PersonName,
ProductVariant = require("phront/data/main.datareel/model/product-variant").ProductVariant,
GeoPosition =  require("montage-geo/logic/model/position").Position,
GeoPoint =  require("montage-geo/logic/model/point").Point,
GeoProjection = require("montage-geo/logic/model/projection").Projection,
B2CCustomerSupplierRelationship = require("phront/data/main.datareel/model/b-2-c-customer-supplier-relationship").B2CCustomerSupplierRelationship,
B2BCustomerSupplierRelationship = require("phront/data/main.datareel/model/b-2-b-customer-supplier-relationship").B2BCustomerSupplierRelationship,

defaultProjection = GeoProjection.forSrid("4326"),
createTestServiceEngagementsForDoctorsAndOrganizationServices = require("./create-etiama-service-engagements").createTestServiceEngagementsForDoctorsAndOrganizationServices;


function createFullTimeEmployeeEmploymentType() {
    var cdiEmploymentType = mainService.createDataObject(EmploymentType);
    cdiEmploymentType.name = "Contrat à durée indéterminée";
    return mainService.saveChanges().then(function(operation) {
        return cdiEmploymentType;
    });
}


function fullTimeEmployeeEmploymentType() {

    //Loclization not ready, we'll have to re-visit that when it is, or just have diffent ones and specify the countries they're valid in
    var criteria = new Criteria().initWithExpression("name == $.name", {
        name: "Contrat à durée indéterminée" //This would be a "Full-time Employee" in the  US.
    });
    var query = DataQuery.withTypeAndCriteria(EmploymentType, criteria);
    var cdiEmploymentType;

    return mainService.fetchData(query)
    .then(function(result) {
        if(!result || result.length === 0) {
            return createFullTimeEmployeeEmploymentType();
        } else {
            return result[0];
        }
    }, function(error) {
            if(error.message.indexOf('"phront.EmploymentType" does not exist') !== -1) {
                //We need to find a way expose the creation of a object descriptor's storage
                //to the main data service.
                var phrontClientService = mainService.childServices[0];
                return Promise.all([
                    phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(EmploymentType))
                ]).then(function() {
                    return createFullTimeEmployeeEmploymentType();
                });
            }
            else {
                return Promise.reject(error);
            }
    });

}




function createOccupationalPhysicianRole() {
    var role = mainService.createDataObject(Role);

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

function occupationalPhysicianRole() {
    /*
        Role name sample:
        "{"en":{"*":"organizer","CA":"organizeur"},"fr":{"*":"organisateur","CI":"l’organisateur","PF":"organisateur"}}"
    */
   var criteria = new Criteria().initWithExpression("name[$language][$region] == $.name", {
        name: "Médecin du travail",
        language: "fr",
        region: "*"
    });
    var query = DataQuery.withTypeAndCriteria(Role, criteria);

    return mainService.fetchData(query)
    .then(function(result) {
        if(!result || result.length === 0) {
            return createOccupationalPhysicianRole();
        } else {
            return result[0];
        }
    }, function(error) {
            if(error.message.indexOf('"phront.EmploymentType" does not exist') !== -1) {
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

}

/*
https://www.thebalancecareers.com/what-is-a-medical-secretary-526043#medical-secretary-duties--responsibilities
*/
function createMedicalSecretaryRole() {
    var role = mainService.createDataObject(Role);

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

function medicalSecretaryRole() {
    //"Secrétaire médicale"
    var criteria = new Criteria().initWithExpression("name[$language][$region] == $.name", {
        name: "Secrétaire médicale",
        language: "fr",
        region: "*"
    });
    var query = DataQuery.withTypeAndCriteria(Role, criteria);

    return mainService.fetchData(query)
    .then(function(result) {
        if(!result || result.length === 0) {
            return createMedicalSecretaryRole();
        } else {
            return result[0];
        }
    }, function(error) {
            if(error.message.indexOf('"phront.EmploymentType" does not exist') !== -1) {
                //We need to find a way expose the creation of a object descriptor's storage
                //to the main data service.
                var phrontClientService = mainService.childServices[0];
                return Promise.all([
                    phrontClientService.createObjectDescriptorStore(phrontClientService.objectDescriptorForType(Role))
                ]).then(function() {
                    return createMedicalSecretaryRole();
                });
            }
            else {
                return Promise.reject(error);
            }
    });

}


function createDoctorWithData(data) {

    //Before we can start we need a few objects:
    var objectPromises = [],
        cdiEmploymentTypePromise = fullTimeEmployeeEmploymentType(),
        occupationalPhysicianRolePromise = occupationalPhysicianRole(),
        medicalSecretaryRolePromise = medicalSecretaryRole();

        objectPromises.push(cdiEmploymentTypePromise);
        objectPromises.push(occupationalPhysicianRolePromise);
        objectPromises.push(medicalSecretaryRolePromise);


    Promise.all(objectPromises)
    .then(function(objectPromisesResolved) {

        var cdiEmploymentType = objectPromisesResolved[0],
            occupationalPhysicianRole = objectPromisesResolved[1],
            medicalSecretaryRole = objectPromisesResolved[2],
            organization = data.organization,
            doctor = mainService.createDataObject(Person),
            doctorName = mainService.createDataObject(PersonName),
            //doctorContactInformation = mainService.createDataObject(ContactInformation),
            doctorPosition = mainService.createDataObject(Position),
            doctorEmploymentPosition = mainService.createDataObject(EmploymentPosition),
            doctorEmploymentPositionStaffing = mainService.createDataObject(EmploymentPositionStaffing),
            doctorSecretary = mainService.createDataObject(Person),
            doctorSecretaryName = mainService.createDataObject(PersonName),
            doctorSecretaryContactInformation = mainService.createDataObject(ContactInformation),
            doctorSecretaryPosition = mainService.createDataObject(Position),
            doctorSecretaryEmploymentPosition = mainService.createDataObject(EmploymentPosition),
            doctorSecretaryEmploymentPositionStaffing = mainService.createDataObject(EmploymentPositionStaffing),
            doctorSecretaryEmploymentPositionRelationship = mainService.createDataObject(EmploymentPositionRelationship),

            /*
                We'remissing a check that Calendar Table may exists or not
            */
           doctorCalendar = mainService.createDataObject(Calendar),
           doctorSecretaryCalendar = mainService.createDataObject(Calendar);


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
        doctorEmploymentPositionStaffing.calendars = [doctorCalendar];
        //WARNING: check if we still need to also do:
        if(!doctorCalendar.owner || doctorCalendar.owner !== doctorEmploymentPositionStaffing) {
            doctorCalendar.owner = doctorEmploymentPositionStaffing;
        }


        doctorEmploymentPositionStaffing.employee = doctor;
        //Inverse:
        doctor.employmentHistory = [doctorEmploymentPositionStaffing];

        //Name
        doctor.name = doctorName;
        doctorName.givenName = data.doctorGivenName;
        doctorName.familyName = data.doctorFamilyName;

        //We don't have personal Contact Information for Doctors
        // doctor.contactInformation = doctorContactInformation;

        //Add Sistra's services to Doctor's services
        doctor.services = organization.services.slice();


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
        //Inverse:
        doctorSecretary.employmentHistory = [doctorSecretaryEmploymentPositionStaffing];

        doctorSecretaryEmploymentPositionStaffing.calendars = [doctorSecretaryCalendar];
        //WARNING: check if we still need to also do:
        if(!doctorSecretaryCalendar.owner || doctorSecretaryCalendar.owner !== doctorSecretaryEmploymentPositionStaffing) {
            doctorSecretaryCalendar.owner = doctorSecretaryEmploymentPositionStaffing;
        }


        //Name
        doctorSecretary.name = doctorSecretaryName;
        doctorSecretary.givenName = data.assistantGivenName;
        doctorSecretary.familyName = data.assistantFamilyName;

        //ContactInformation
        doctorSecretary.contactInformation = doctorSecretaryContactInformation;
        doctorSecretaryContactInformation.emailAddrresses = [data.assistantEmail];
        //TODO:
        //assistantEmail: "dayana.raveino@sistra.pf"


        //setup Doctor and secretary EmploymentPositionRelationship with organization
        doctorSecretaryEmploymentPositionRelationship.firstEmploymentPosition = doctorEmploymentPosition;
        doctorSecretaryEmploymentPositionRelationship.secondEmploymentPosition = doctorSecretaryEmploymentPosition;

        return mainService.saveChanges().then(function(operation) {
            return doctor;
        });

    });

}

function createObjectDescriptorStoreIfMissing(objectDescriptor) {
    var query = DataQuery.withTypeAndCriteria(objectDescriptor);

    query.fetchLimit = 1;

    return mainService.fetchData(query)
    .then(function (result) {
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


exports.createEtiamaProServices = function() {


    return Promise.all([createObjectDescriptorStoreIfMissing(Calendar),createObjectDescriptorStoreIfMissing(Event), createObjectDescriptorStoreIfMissing(Position), createObjectDescriptorStoreIfMissing(EmploymentPosition),createObjectDescriptorStoreIfMissing(EmploymentType),createObjectDescriptorStoreIfMissing(EmploymentPositionStaffing),createObjectDescriptorStoreIfMissing(EmploymentPositionRelationship), createObjectDescriptorStoreIfMissing(ContactInformation),createObjectDescriptorStoreIfMissing(B2CCustomerSupplierRelationship),createObjectDescriptorStoreIfMissing(B2BCustomerSupplierRelationship)])
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
            sistraAddress.address1 = "Immeuble FARHNAM, à l'angle des rues Clappier et Leboucher";
            sistraAddress.address2 = "B.P. 972";
            sistraAddress.city = "PAPEETE";
            //sistraAddress.provinceCode = "";
            sistraAddress.zip = "98713";
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
        var servicesCriteria = new Criteria().initWithExpression("vendors.has($vendor)", {
            vendor: sistraOrganization
        });
        var servicesQuery = DataQuery.withTypeAndCriteria(Service, servicesCriteria);
        return mainService.fetchData(servicesQuery)
        .then(function(result) {
            var service, variant;

            if(result && result.length > 2) {
                console.log("Sistra provided servicea: ",result);
            }
            else {
        /*
            Create Services

            Les salariés identifiés comme S.M.R. (ou Surveillance Médicale Renforcée) ont une vsisite médicale par an, les autres, les S.M.O. (surveillance médicale Ordinaire) ont une visite médicale tous les deux ans.

            https://www.sistra.pf/nos-prestations
        */

                //Surveillance Médicale Ordinaire - 20mn
                service = mainService.createDataObject(Service);
                service.vendors = [sistraOrganization];
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
                service.vendors = [sistraOrganization];
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
                service.vendors = [sistraOrganization];
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
                service.vendors = [sistraOrganization];
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
                        role: occupationalPhysicianRole
                        },
                        sistraDoctorsCriteria = new Criteria().initWithExpression("givenName == $.givenName && familyName == $.familyName", sistraDoctorsCriteriaParameters),
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

                            creationData.doctorGivenName = "Marion";
                            creationData.doctorFamilyName = "Aufils";
                            creationData.assistantGivenName = "Evalina";
                            creationData.assistantFamilyName = "Teriierooiterai";
                            creationData.assistantEmail = "evalina.maraetefau@sistra.pf";
                            doctorPromises.push(createDoctorWithData(creationData));

                            creationData.doctorGivenName = "Claude";
                            creationData.doctorFamilyName = "Paulet";
                            creationData.assistantGivenName = "Virginia";
                            creationData.assistantFamilyName = "Teissier";
                            creationData.assistantEmail = "virginia.teissier@sistra.pf";
                            doctorPromises.push(createDoctorWithData(creationData));

                            creationData.doctorGivenName = "Francine";
                            creationData.doctorFamilyName = "Oval";
                            creationData.assistantGivenName = "Hamoura";
                            creationData.assistantFamilyName = "Pae";
                            creationData.assistantEmail = "hamoura.pae@sistra.pf";
                            doctorPromises.push(createDoctorWithData(creationData));

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

            return createTestServiceEngagementsForDoctorsAndOrganizationServices(sistraDoctors, sistraOrganization, sistraOrganization.services, startDate)
            .then(function() {
                return mainService.saveChanges();
            });

        },function(error) {
            console.error(error);
        });

    });
}

