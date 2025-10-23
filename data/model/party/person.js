const Person = require("mod/data/model/party/person").Person,
    Montage = require("mod/core/core").Montage;

/**
 * @class Person
 * @extends Party
 */

exports.Person = Person;

Montage.defineProperties(Person.prototype, {
    professionalProfiles: {
        value: undefined
    },
    serviceProductVariantsProvided: {
        value: undefined
    },
    respondentQuestionnaires: {
        value: undefined
    },
    supplierRelationships: {
        value: undefined
    },
    customerSupplierResponsibilities: {
        value: undefined
    },
    firstPersonalRelationships: {
        value: undefined
    },
    secondPersonalRelationships: {
        value: undefined
    }
});