var mainService = require("phront/test/data/client-main.datareel/main.mjson").montageObject,
Criteria = require("montage/core/criteria").Criteria,
DataStream = require("montage/data/service/data-stream").DataStream,
DataQuery = require("montage/data/model/data-query").DataQuery,
Collection = require("phront/data/main.datareel/model/collection").Collection,
Image = require("phront/data/main.datareel/model/image").Image,
Organization = require("phront/data/main.datareel/model/organization").Organization,
Address = require("phront/data/main.datareel/model/address").Address,
Service = require("phront/data/main.datareel/model/service").Service,
ProductVariant = require("phront/data/main.datareel/model/product-variant").ProductVariant;



exports.createEtiamaProServices = function() {


    //Fetch/create SISTRA
    var organizationCriteria = new Criteria().initWithExpression("name == $.name", {
        name: "SISTRA"
    });
    var organizationQuery = DataQuery.withTypeAndCriteria(Organization, organizationCriteria);
    var sistraOrganization;

    return mainService.fetchData(organizationQuery)
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
           var sistraAddress = mainService.createDataObject(Address);
           sistraAddress.name = "SISTRA";
        //    sistraAddress.firstName = jShopifyAddress.firstName;
        //    sistraAddress.lastName = jShopifyAddress.lastName;
            sistraAddress.phone = "40.50.19.99";
            sistraAddress.address1 = "Immeuble FARHNAM, à l'angle des rues Clappier et Leboucher";
            sistraAddress.address2 = "B.P. 972";
            sistraAddress.city = "PAPEETE";
            //sistraAddress.provinceCode = "";
            sistraAddress.zip = "98713";
            sistraAddress.country = "TAHITI – POLYNÉSIE FRANÇAISE";
            sistraAddress.latitude = "-17.535409";
            sistraAddress.longitude = "-149.567452";

            sistraOrganization.addresses = [sistraAddress];
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
                        return true;
                        //return createCompletedOperation.data;
                    },function(error) {
                        console.error(error);
                        return Promise.reject(error);
                    });

            }

        },function(error) {
            console.error(error);
        });

    });
}

